import Link from "next/link.js";

export default function Page() {
    return (
        <>
            <div>
                <Link href="/test/1/login">
                    Login 1
                </Link>
            </div>
            <div>
                <Link href="/test/2/login">
                    Login 2
                </Link>
            </div>
            <div>
                <Link href="/test/3/login">
                    Login 3
                </Link>
            </div>
        </>
    );
}