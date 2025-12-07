/**
 * @file src/pages/_app.tsx
 * @description App wrapper with providers
 */

import type { AppProps } from "next/app";
import "@/index.css";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorProvider } from "@/contexts/ErrorContext";
import ApiProvider from "@/providers/ApiProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <ToastProvider>
          <ApiProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Component {...pageProps} />
              </main>
              <Footer />
            </div>
          </ApiProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}