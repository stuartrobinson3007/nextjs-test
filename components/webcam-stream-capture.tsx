"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

// This sets the maximum number of seconds the video can be
const MAX_SECONDS = 10;

const WebcamStreamCapture = () => {
  const [pageState, setPageState] = useState<
    | "initializing"
    | "ready"
    | "recording"
    | "finished-recording"
    | "uploading"
    | "success"
    | "permission-denied"
    | "error"
  >("initializing");

  const videoConstraints: MediaTrackConstraints = {
    width: 640,
    height: 640,
    aspectRatio: 1,
  };

  // cameras is a list of all cameras connected to the user's device
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>();
  // deviceId is the id of the camera that is currently being used
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // This is the ref to the Webcam component from react-webcam
  const webcamRef = useRef<Webcam | null>(null);

  // This is the ref to the MediaRecorder object which we use to control the start, stop and dataavailable events for the recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // We store the recorded chunks in state which updates as the recording progresses (handled when the MediaRecorder dataavailable event is fired)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // This is the number of seconds remaining for the recording, we count down from MAX_SECONDS
  const [seconds, setSeconds] = useState(MAX_SECONDS);

  // The videoRef is used to display the recorded video once the recording is finished
  const videoRef = useRef<HTMLVideoElement>(null);

  // This is the function that is called when the user grants permission to use the camera and microphone
  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const cameras = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setCameras(cameras ? cameras : []);
      setDeviceId(cameras ? cameras[0].deviceId : null);
      setPageState("ready");
    },
    [setCameras]
  );

  // Request permission to use the camera and microphone
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then(() => {
        // Once the user grants permission we get the list of devices and set the deviceId state to the first camera in the list
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
      })
      .catch((err) => {
        // Check if the error happens because the user denies access to the camera or microphone
        if (err.name === "NotAllowedError") {
          setPageState("permission-denied");
        } else {
          setPageState("error");
        }
      });
  }, [handleDevices]);

  // The MediaRecorder processes data in chunks, this function handles the dataavailable event which fires when a chunk of data is ready to be processed
  // We concatenate the chunk to the recordedChunks state so that we can access it when the recording is finished
  const handleDataAvailable = useCallback(
    ({ data }: BlobEvent) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  // This function is called when the user clicks the start recording button
  const handleStartCapture = useCallback(() => {
    setPageState("recording");
    setRecordedChunks([]);
    setSeconds(MAX_SECONDS);

    // First we create a new MediaRecorder object and pass it the stream from the webcam
    mediaRecorderRef.current = new MediaRecorder(
      webcamRef?.current?.stream as MediaStream
    );
    // Then we add an event listener to the dataavailable event so that we can store the data as the recording progresses
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    // Finally we start the recording
    mediaRecorderRef.current.start();

    // Remove the event listener when the component unmounts
    return () => {
      mediaRecorderRef.current?.removeEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current?.stop();
    };
  }, [handleDataAvailable]);

  // Stop the recording if the user clicks the stop recording button or the timer reaches 0
  const handleStopCapture = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setPageState("finished-recording");
  }, []);

  // Once the page state is "finished-recording" we set the videoRef src to the recorded video
  // Handling this is a useEffect is the safest way to ensure that the videoRef is set after the recording is finished and the chunks are ready
  useEffect(() => {
    if (pageState === "finished-recording" && videoRef.current) {
      const videoBlob = new Blob(recordedChunks, { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(videoBlob);
      videoRef.current.src = videoUrl;
    }
  }, [pageState, recordedChunks]);

  // Handle the timer countdown
  useEffect(() => {
    let timer: any = null;
    if (pageState === "recording") {
      timer = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
      if (seconds < 1) {
        handleStopCapture();
        setSeconds(0);
      }
    }
    return () => {
      clearInterval(timer);
    };
  }, [pageState, seconds, handleStopCapture]);

  // Once the recording has finished and the user has been given a change to review the video, this functions handles the upload to Cloudinary when they click the upload button
  const handleUpload = async () => {
    if (recordedChunks.length) {
      // Create a new blob from all the recorded chunks
      const file = new Blob(recordedChunks, {
        type: `video/mp4`,
      });

      // If the file is larger than 100MB we display an error
      if (file.size > 100000000) {
        alert("File is too big!");
        return;
      }

      const env = {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "duqw460bf",
        NEXT_PUBLIC_CLOUDINARY_API_KEY: "182882417159686",
      };

      const uploadPreset = "video-test";
      const folder = "video_test";

      // Upload the file to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", env.NEXT_PUBLIC_CLOUDINARY_API_KEY);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(response);

      if (!response.ok) {
        throw new Error("Upload failed. Response status: " + response.status);
      }

      const data = await response.json();
      console.log(data);
      setPageState("success");
    }
  };

  function restartVideo() {
    setRecordedChunks([]);
    setPageState("ready");
    setSeconds(MAX_SECONDS);
  }

  // We change the camera by changing the deviceId state
  // This is called when the user clicks the switch camera button
  const handleDeviceSwitch = useCallback(() => {
    if (!cameras || !deviceId) return;
    const nextDeviceId =
      cameras.find((device) => device.deviceId !== deviceId)?.deviceId ||
      cameras[0].deviceId;

    setDeviceId(nextDeviceId);
  }, [deviceId, cameras]);

  return (
    <div className="flex flex-col items-center justify-center">
      {pageState === "initializing" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          Loading...
        </div>
      ) : pageState === "ready" || pageState === "recording" ? (
        cameras && deviceId ? (
          <>
            <div className="flex-1 h-[640px] w-[640px] max-w-full rounded-lg overflow-hidden relative aspect-square max-h-[70vh] bg-white/5">
              <Webcam
                videoConstraints={{ ...videoConstraints, deviceId: deviceId }}
                width={640}
                height={640}
                className="object-cover w-full h-full"
                ref={webcamRef}
              />
              {pageState === "recording" && (
                <div className="absolute bottom-5 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-0.5 text-sm font-medium text-gray-900">
                    {new Date((MAX_SECONDS - seconds) * 1000)
                      .toISOString()
                      .slice(14, 19)}
                  </span>
                </div>
              )}
              {cameras.length > 1 && (
                <button
                  className="absolute bottom-0 right-0 bg-gray-500 text-white rounded-lg p-2 m-2"
                  onClick={handleDeviceSwitch}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-8">
              {pageState === "ready" ? (
                <button
                  className="rounded-full border-red-600 border-2 p-1"
                  onClick={handleStartCapture}
                >
                  <span className="block bg-red-600 rounded-full h-6 w-6" />
                </button>
              ) : pageState === "recording" ? (
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  onClick={handleStopCapture}
                >
                  Stop Recording
                </button>
              ) : pageState === "finished-recording" ? (
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
                  Upload
                </button>
              ) : pageState === "uploading" ? (
                <div className="px-4 py-2 bg-gray-500 text-white rounded-lg">
                  Uploading...
                </div>
              ) : (
                pageState === "error" && (
                  <div className="text-gray-500">
                    <div className="text-gray-500">There was an error</div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                      Try Again
                    </button>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-500 h-[70vh] flex items-center justify-center">
            No camera found
          </div>
        )
      ) : pageState === "finished-recording" ? (
        <>
          <div className="flex-1 h-[640px] w-[640px] max-w-full rounded-lg overflow-hidden relative aspect-square max-h-[70vh] bg-white/5">
            <video
              className="absolute object-cover w-full h-full"
              width={640}
              height={640}
              controls
              crossOrigin="anonymous"
              ref={videoRef}
            />
          </div>

          <div className="mt-8 flex items-center justify-center">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg mr-4"
              onClick={restartVideo}
            >
              Restart
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
              onClick={handleUpload}
            >
              Upload
            </button>
          </div>
        </>
      ) : pageState === "uploading" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          Uploading...
        </div>
      ) : pageState === "success" ? (
        <>
          <div className="mt-8 flex items-center justify-center">done</div>
        </>
      ) : pageState === "permission-denied" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          Please refresh and allow camera access or check your browser settings
        </div>
      ) : pageState === "error" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          There was an error
        </div>
      ) : null}
    </div>
  );
};

export default WebcamStreamCapture;
