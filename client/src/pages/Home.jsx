import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activePlan, setActivePlan] = useState("pro");

  const features = [
    {
      icon: <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: "Lightning Fast",
      description: "Generate stunning thumbnails in seconds with AI power",
    },
    {
      icon: <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
      title: "Creative Control",
      description: "Customize every aspect of your thumbnail design",
    },
    {
      icon: <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      title: "Boost CTR",
      description: "Increase click-through rates with eye-catching designs",
    },
    {
      icon: <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 7h10v10H7V7zm2 2h6v6H9V9z" /></svg>,
      title: "AI-Powered",
      description: "Intelligent design suggestions based on trends",
    },
  ];

 

  const plans = [
    {
      name: "Starter",
      price: "₹9",
      credits: 50,
      features: ["50 credits/month", "Basic templates", "Email support"],
      id: "starter",
    },
    {
      name: "Pro",
      price: "₹29",
      credits: 200,
      features: ["200 credits/month", "Premium templates", "Priority support", "Custom branding"],
      id: "pro",
      popular: true,
    },
    {
      name: "Creator",
      price: "₹99",
      credits: 1000,
      features: ["1000 credits/month", "All templates", "24/7 support", "API access", "Team collaboration"],
      id: "creator",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              

              <h1 className="text-5xl font-bold leading-tight md:text-6xl">
                AI Thumbnail <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Generator</span> for YouTube
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed">
                Turn ideas into high-impact thumbnails with fast prompts, vibrant visuals, and a simple creator workflow.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate("/generate")}
                  className="group relative px-8 py-4 font-semibold text-white rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">Generate Now</span>
                </button>
                <button
                  onClick={() => navigate("/community")}
                  className="px-8 py-4 font-semibold text-white rounded-full border-2 border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-300 transform hover:scale-105"
                >
                  View Creations
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="relative">
              <div className="aspect-video rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40 flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent opacity-40" />
                <div className="relative z-10 text-center">
                  <svg className="w-20 h-20 text-purple-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  <p className="text-purple-300 font-medium">Thumbnail preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16 bg-black/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-wider text-purple-400 uppercase">FEATURES</p>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Built for fast creative momentum</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group relative rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent p-6 transition-all duration-300 cursor-pointer hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-110 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 rounded-xl transition-all duration-300" />
                <div className="relative z-10 space-y-4">
                  <span className="text-4xl">{feature.icon}</span>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      
      {/* Pricing Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16 bg-black/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-wider text-purple-400 uppercase">PRICING</p>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-400">Choose the perfect plan for your creative journey</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setActivePlan(plan.id)}
                className={`group relative rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
                  activePlan === plan.id
                    ? "border-pink-500 bg-gradient-to-br from-pink-900/40 to-purple-900/40 shadow-2xl shadow-pink-500/30 scale-105"
                    : "border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-transparent hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="mt-2 text-purple-300 font-semibold">{plan.credits} monthly credits</p>
                  </div>

                  <button
                    className={`w-full py-3 px-6 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      activePlan === plan.id
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50"
                        : "bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border border-purple-500/30"
                    }`}
                  >
                    Get Started
                  </button>

                  <div className="space-y-3 pt-4 border-t border-purple-500/20">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 transform transition-all duration-300 hover:translate-x-2">
                        <svg className="w-5 h-5 flex-shrink-0 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-12 text-center overflow-hidden hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-600/20 to-purple-600/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-bold md:text-5xl">Ready to create amazing thumbnails?</h2>
              <p className="text-lg text-gray-400">Start generating stunning thumbnails today with AI-powered design.</p>
              <button
                onClick={() => navigate("/generate")}
                className="inline-block px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:scale-110"
              >
                Generate Your First Thumbnail
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}