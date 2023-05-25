import Link from "next/link";

export const revalidate = 0;

export default function Page() {


    const random = Math.random();


    return (
        <>
            <div>
                Page: Home {">"} Test
            </div>

            <div className="mt-10">
                We want this to be a new random number each time: {random}
            </div>

            <div className="mt-10 text-blue-500">
                <Link href="/">Navigate back to Home page</Link>
            </div>
        </>
    );
}