import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-brand-bg flex items-center justify-center px-6 py-20">
            <div className="max-w-lg w-full bg-white rounded-[2rem] border border-gray-100 shadow-xl p-10 text-center">
                <div className="font-hero font-bold text-6xl text-brand-orange mb-2">404</div>

                <h1 className="font-hero font-bold text-3xl text-brand-dark mb-3">
                    Page not found
                </h1>
                <p className="text-gray-500 font-noname mb-8">
                    That page has moved or never existed. Let&apos;s get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3.5 rounded-full bg-brand-dark text-white font-bold hover:bg-brand-orange transition-all shadow-lg"
                    >
                        Go home
                    </Link>
                    <Link
                        href="/practice"
                        className="px-8 py-3.5 rounded-full bg-white border-2 border-gray-100 text-brand-dark font-bold hover:border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Browse practice
                    </Link>
                </div>
            </div>
        </main>
    );
}
