/**
 * @file src/pages/index.tsx
 * @description Home page
 */

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Code, Briefcase, Users, Search, ArrowRight, Github, ExternalLink } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Project Info Banner - Required for Submission */}
      <section className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Team Members */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Team Members
              </h2>
              <p className="text-white font-medium">
                Akash Shridhar Shetty - Section [05 ] 
                <span className="mx-2">|</span>
                Skandhan Madhusudhana - Section [05 ]
              </p>
              {/* Add more team members here if needed */}
            </div>

            {/* GitHub Repositories */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/akashshetty1997/devmatch-frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Github size={18} />
                <span>Frontend Repo</span>
                <ExternalLink size={14} className="text-gray-400" />
              </a>
              <a
                href="https://github.com/akashshetty1997/devmatch-backend"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Github size={18} />
                <span>Backend Repo</span>
                <ExternalLink size={14} className="text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Connect Developers with Opportunities
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Search GitHub repos, find jobs, and grow your developer network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  href="/search"
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  Search Repos
                </Link>
                <Link
                  href="/jobs"
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 flex items-center justify-center gap-2"
                >
                  <Briefcase size={20} />
                  Browse Jobs
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to grow your career
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Explore Repositories
              </h3>
              <p className="text-gray-600">
                Search and discover GitHub repositories. Save your favorites and
                share with the community.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Find Jobs
              </h3>
              <p className="text-gray-600">
                Browse job listings from top companies. Apply directly and track
                your applications.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Build Your Network
              </h3>
              <p className="text-gray-600">
                Connect with other developers and recruiters. Share posts and
                grow your professional network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of developers already using DevMatch.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}