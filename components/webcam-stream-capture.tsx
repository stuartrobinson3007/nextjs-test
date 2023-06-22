"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const MAX_SECONDS = 10;

const WebcamStreamCapture = () => {
  const [pageState, setPageState] = useState<
    | "initializing"
    | "ready"
    | "recording"
    | "finished-recording"
    | "uploading"
    | "success"
    | "error"
  >("initializing");

  const videoConstraints = {
    facingMode: "user",
    width: 640,
    height: 640,
    aspectRatio: 1,
  };

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>();

  const webcamRef = useRef<Webcam | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [seconds, setSeconds] = useState(MAX_SECONDS);

  /////////////////
  // JUST FOR TESTING
  /////////////////
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput"));
      setPageState("ready");
    },
    [setDevices]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const handleDeviceSwitch = useCallback(() => {
    if (!devices || !deviceId) return;
    const nextDeviceId =
      devices.find((device) => device.deviceId !== deviceId)?.deviceId ||
      devices[0].deviceId;

    setDeviceId(nextDeviceId);
  }, [deviceId, devices]);

  const handleDataAvailable = useCallback(
    ({ data }: BlobEvent) => {
      if (data.size > 0) {
        console.log(data);
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  useEffect(() => {
    console.log("recordedChunks", recordedChunks);
  }, [recordedChunks]);

  const handleStartCapture = useCallback(() => {
    setPageState("recording");
    setRecordedChunks([]);
    setSeconds(MAX_SECONDS);

    mediaRecorderRef.current = new MediaRecorder(
      webcamRef?.current?.stream as MediaStream
    );
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();

    return () => {
      mediaRecorderRef.current?.removeEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current?.stop();
    };
  }, [handleDataAvailable]);

  const handleStopCapture = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setTimeout(() => {
      setPageState("finished-recording");
    }, 0);
  }, []);

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

  const handleUpload = async () => {
    if (recordedChunks.length) {
      const file = new Blob(recordedChunks, {
        type: `video/webm`,
      });

      // This creates a unique id for the file name
      const unique_id = Math.random().toString(36).substr(2, 9);

      const env = {
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "duqw460bf",
        NEXT_PUBLIC_CLOUDINARY_API_KEY: "182882417159686",
      };

      const uploadPreset = "video-test";
      const folder = "video_test";

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
      setVideoUrl(data.secure_url);
    }
  };

  function restartVideo() {
    setRecordedChunks([]);
    setPageState("ready");
    setSeconds(MAX_SECONDS);
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {pageState === "initializing" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          Loading...
        </div>
      ) : pageState === "ready" || pageState === "recording" ? (
        devices.length > 0 ? (
          <>
            <div className="flex-1 h-[640px] w-[640px] max-w-full rounded-lg overflow-hidden relative aspect-square max-h-[70vh] bg-white/5">
              <Webcam
                videoConstraints={{ ...videoConstraints, deviceId: deviceId }}
                width={640}
                height={640}
                className="object-cover w-full h-full "
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
              {devices.length > 1 && (
                <button
                  className="absolute bottom-0 right-0 bg-gray-500 text-white rounded-lg p-2 m-2"
                  onClick={handleDeviceSwitch}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
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
          <div className="text-gray-500 h-[70vh] flex items-center justify-center">
            <video
              className="w-full h-full rounded-lg"
              controls
              crossOrigin="anonymous"
            >
              <source
                src={URL.createObjectURL(
                  new Blob(recordedChunks, { type: "video/mp4" })
                )}
                type="video/mp4"
              />
            </video>
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
          <div className="text-gray-500 h-[70vh] flex items-center justify-center">
            <video
              className="w-full h-full rounded-lg"
              controls
              crossOrigin="anonymous"
              autoPlay
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>

          <div className="mt-8 flex items-center justify-center">done</div>
        </>
      ) : pageState === "error" ? (
        <div className="text-gray-500 h-[70vh] flex items-center justify-center">
          There was an error
        </div>
      ) : null}
    </div>
  );
};

export default WebcamStreamCapture;
