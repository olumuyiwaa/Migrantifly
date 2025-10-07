import SetupAccountForm from './SetupAccountForm';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Page({ searchParams }) {
    const token = typeof searchParams?.token === 'string' ? searchParams.token : '';

    return (
        <main className="flex flex-col min-h-screen">
            <Header />

            {/* Hero Section */}
            <section
                className="relative bg-slate-800 py-20 bg-cover bg-center min-h-[55vh] flex items-center justify-center"
                style={{ backgroundImage: 'url("/images/bg.png")' }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50" /> {/* Overlay */}
                <div className="relative z-10 text-center text-white px-4">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                        Complete Your Account Setup
                    </h1>
                    <p className="text-lg sm:text-xl max-w-2xl mx-auto">
                        Your privacy and data security are our top priorities.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <section className="flex-grow flex items-center justify-center bg-gray-50 py-10 px-4">
                <div className="w-full max-w-md">
                    <SetupAccountForm token={token} />
                </div>
            </section>

            <Footer />
        </main>
    );
}
