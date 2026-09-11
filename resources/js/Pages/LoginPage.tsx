import { useState } from 'react';
import { Button } from '@/Components/common/Button';
import { Input } from '@/Components/common/Input';

type LoginPageProps = {
    onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [email, setEmail] = useState('superadmin@tms.test');
    const [password, setPassword] = useState('superadmin123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await onLogin(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to log in.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
            <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 px-8 pb-8 pt-9 text-white">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold shadow-inner ring-1 ring-white/20">
                        TM
                    </div>
                    <h1 className="text-center text-2xl font-semibold tracking-tight">Tenant Management System</h1>
                    <p className="mt-2 text-center text-sm text-slate-300">Secure access to your property portfolio</p>
                </div>

                <div className="p-8">
                    <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                        Demo accounts: superadmin@tms.test / superadmin123; manager@tenant-a.test / manager123; manager@tenant-b.test / manager123; tenant@tenant-a.test / tenant123; tenant@tenant-b.test / tenant123
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="superadmin@tms.test"
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="superadmin123"
                        />

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 px-4 py-3 text-sm font-semibold shadow-lg shadow-slate-200 hover:from-slate-800 hover:to-indigo-800" disabled={loading}>
                            {loading ? 'Signing in...' : 'Access dashboard'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
