'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { 
  Users, 
  CheckCircle2, 
  IndianRupee, 
  ArrowRight, 
  Clock, 
  Smartphone, 
  ChevronDown, 
  Sparkles, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { user, signInAsDemo } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = useState<'overview' | 'clients' | 'jobs' | 'revenue'>('overview');
  
  // Interactive preview state with amounts in Rupees
  const [sampleTasks, setSampleTasks] = useState([
    { id: '1', title: 'Commercial 3-phase meter & panel installation', client: 'Harrison Properties', status: 'in-progress', amount: 45000, priority: 'high' },
    { id: '2', title: 'Seasonal HVAC filter inspection & motor tune-up', client: 'Apex Retail Park', status: 'pending', amount: 18500, priority: 'medium' },
    { id: '3', title: 'Emergency valve replacement - Suite 304', client: 'Greenwood Dental Clinic', status: 'completed', amount: 26000, priority: 'high' },
  ]);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleTaskStatus = (id: string) => {
    setSampleTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'completed' ? 'in-progress' : 'completed'
        };
      }
      return t;
    }));
  };

  const pendingCount = sampleTasks.filter(t => t.status !== 'completed').length;
  const totalRevenue = sampleTasks.reduce((acc, t) => acc + (t.status === 'completed' ? t.amount : 0), 125000);

  const faqs = [
    {
      q: 'How easy is ServiceLoop for non-tech users?',
      a: 'Extremely simple. We built it specifically for business owners, contractors, and technicians. Big clear buttons, one-tap WhatsApp and phone dialing, zero confusing menus, and automatic calculation of all your rupee balances.'
    },
    {
      q: 'Can another business ever see my clients or revenue?',
      a: 'Never. Every business has a private, cryptographically isolated space in Cloud Firestore. Even if another business operates in the exact same trade in your city, your numbers, customer records, and follow-ups are strictly private to your account.'
    },
    {
      q: 'What credentials are required to register?',
      a: 'Signing up takes under 30 seconds: email, password, owner name, Indian contact phone number (+91), business name, category, and city location. You are immediately redirected to a fresh, private dashboard.'
    },
    {
      q: 'Does it work smoothly on mobile phones?',
      a: 'Yes, flawlessly. Whether you are on-site with a client, in transit, or at your desk, you can tap to call clients, send WhatsApp reminders, and update work orders in real-time from any device.'
    },
    {
      q: 'Can I try the system before creating an account?',
      a: 'Yes! Click "Launch Live Demo" anywhere on this page to immediately open an active workspace with sample Indian clients and work orders in 1 click.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600">
            <a href="#features" className="hover:text-zinc-950 transition-colors">Features</a>
            <a href="#preview" className="hover:text-zinc-950 transition-colors">Live Demo</a>
            <a href="#workflow" className="hover:text-zinc-950 transition-colors">Sequence & Flow</a>
            <a href="#faq" className="hover:text-zinc-950 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5" suppressHydrationWarning>
            {user ? (
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all border border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 px-3 py-2 transition-colors"
                >
                  Log In
                </Link>
                <button
                  onClick={() => signInAsDemo()}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-white text-zinc-800 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Try Demo
                </button>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-zinc-200/70 overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-slate-100/30">
        {/* Subtle Luxury Ambient Radial Mesh & Fine Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Clean SaaS Kicker */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] rounded-full text-xs font-semibold text-zinc-800 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>Modern CRM for Trade & Service Businesses</span>
            <span aria-hidden="true" className="text-zinc-300">·</span>
            <span className="text-zinc-600 font-medium">100% Private Workspace</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-sans font-extrabold tracking-tight text-zinc-950 leading-[1.12]"
          >
            Manage every client, job, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-indigo-600 bg-clip-text text-transparent">
              and rupee in one seamless flow.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed"
          >
            Never lose a client callback, pending work order, or unpaid invoice again. 
            Tailored for contractors, technicians, and local service providers who want clarity with zero technical complexity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 text-white px-7 py-3.5 rounded-xl font-bold transition-all text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_8px_rgba(0,0,0,0.08)] border border-zinc-800 group"
            >
              Log In to Account
              <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-zinc-900 border border-zinc-200/90 hover:border-zinc-300 px-7 py-3.5 rounded-xl font-bold hover:bg-zinc-50/80 transition-all text-sm shadow-[0_1px_3px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              Register New Business
            </Link>

            <button
              onClick={() => signInAsDemo()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/80 px-6 py-3.5 rounded-xl font-bold transition-all text-sm cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1-Click Live Demo
            </button>
          </motion.div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-zinc-600 font-semibold">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Zero setup fees
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> WhatsApp & Call buttons
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Cloud Firestore realtime sync
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Live SaaS Preview Component */}
      <section id="preview" className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Experience The Interface
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
              Interactive Dashboard Preview
            </h2>
            <p className="mt-2.5 text-zinc-600 text-sm sm:text-base max-w-xl mx-auto">
              Test out the responsive controls below. Switch views, review rupee amounts, and test task completion.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-[0_25px_65px_-15px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.03)] ring-1 ring-zinc-950/5 overflow-hidden">
            {/* Window header */}
            <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 px-5 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/90"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90"></span>
                <span className="ml-3 text-xs font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-2.5 py-0.5 rounded-md">app.serviceloop.in/dashboard</span>
              </div>

              {/* Segmented filter controls */}
              <div className="flex items-center gap-1 bg-zinc-800/90 border border-zinc-700/60 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActivePreviewTab('overview')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activePreviewTab === 'overview' ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActivePreviewTab('clients')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activePreviewTab === 'clients' ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Clients (3)
                </button>
                <button
                  onClick={() => setActivePreviewTab('jobs')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activePreviewTab === 'jobs' ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Work Orders ({sampleTasks.length})
                </button>
                <button
                  onClick={() => setActivePreviewTab('revenue')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activePreviewTab === 'revenue' ? 'bg-white text-zinc-950 font-bold shadow-xs' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Revenue
                </button>
              </div>
            </div>

            {/* Dashboard body preview */}
            <div className="p-6 sm:p-8 space-y-6 bg-slate-50/60">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-zinc-300 transition-all">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
                    <span>Collected Revenue</span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50/90 text-indigo-700 flex items-center justify-center border border-indigo-100">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-950">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All payments reconciled
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-zinc-300 transition-all">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
                    <span>Active Customers</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-50/90 text-blue-800 flex items-center justify-center border border-blue-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-950">
                    18
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Bengaluru & Mumbai regions
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-zinc-300 transition-all">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
                    <span>Follow-ups & Jobs</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50/90 text-amber-800 flex items-center justify-center border border-amber-100">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2 text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-950">
                    {pendingCount} Pending
                  </div>
                  <div className="mt-1 text-xs text-amber-700 font-semibold">
                    Scheduled for this week
                  </div>
                </div>
              </div>

              {/* Sample Work Order rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Interactive Work Orders (Click to toggle status)</span>
                  <span className="text-indigo-600 font-bold">Live Synced</span>
                </div>

                {sampleTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskStatus(task.id)}
                    className="p-4 rounded-xl border border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">{task.title}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/60 font-mono">
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        Client: <strong className="text-zinc-700">{task.client}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="font-mono font-bold text-sm text-zinc-950">
                        ₹{task.amount.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      }`}>
                        {task.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sequence & Flow Section */}
      <section id="workflow" className="py-20 bg-slate-50/70 border-b border-zinc-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Clear & Simple Flow
            </span>
            <h3 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
              The Clear User Sequence
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Intuitive flow for non-tech users with strict privacy isolation between businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_25px_-5px_rgba(0,0,0,0.03)] hover:border-zinc-300 hover:-translate-y-0.5 transition-all relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white font-mono font-bold text-xs flex items-center justify-center mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-zinc-800">
                1
              </div>
              <h4 className="text-lg font-bold text-zinc-950 mb-2">Landing Page → Login</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Click <strong>Log In</strong> from the landing page. If you have an account, enter your credentials and jump straight to your dashboard and settings.
              </p>
            </div>

            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_25px_-5px_rgba(0,0,0,0.03)] hover:border-zinc-300 hover:-translate-y-0.5 transition-all relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white font-mono font-bold text-xs flex items-center justify-center mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-zinc-800">
                2
              </div>
              <h4 className="text-lg font-bold text-zinc-950 mb-2">No Account? → Register</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Provide your email, phone (+91), name, business name, category, and location. Your dedicated profile is created instantly in one simple form.
              </p>
            </div>

            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_10px_25px_-5px_rgba(0,0,0,0.03)] hover:border-zinc-300 hover:-translate-y-0.5 transition-all relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white font-mono font-bold text-xs flex items-center justify-center mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-zinc-800">
                3
              </div>
              <h4 className="text-lg font-bold text-zinc-950 mb-2">Dashboard & Settings</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Open a fresh, private dashboard. Add clients, log follow-ups, issue rupee work orders. Strict multi-tenant rules guarantee no other business sees your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 bg-white border-b border-zinc-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Built For Speed & Ease
            </span>
            <h3 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-zinc-950">
              Why ServiceLoop Stands Apart
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl border border-zinc-200/80 bg-slate-50/50 hover:bg-white hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] border border-zinc-800">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-950 mb-1">Rupee Cash Flow</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Reconcile collected vs. pending invoices in Indian Rupees (₹) with zero confusion.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/80 bg-slate-50/50 hover:bg-white hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] border border-zinc-800">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-950 mb-1">WhatsApp & Call</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Direct one-click dialer and WhatsApp chat links for every client and follow-up item.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/80 bg-slate-50/50 hover:bg-white hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] border border-zinc-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-950 mb-1">Total Privacy Vault</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Cryptographic document security rules strictly isolate all client records to your UID.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-200/80 bg-slate-50/50 hover:bg-white hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] border border-zinc-800">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-zinc-950 mb-1">Non-Tech Friendly</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Big readable text, generous touch targets, and high contrast for effortless field use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50/70 border-b border-zinc-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Answers
            </span>
            <h3 className="text-3xl font-sans font-bold tracking-tight text-zinc-950">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-zinc-200/80 rounded-xl bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-zinc-300 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full text-left px-5.5 py-4 flex items-center justify-between gap-4 font-semibold text-sm text-zinc-900 hover:text-zinc-950 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180 text-zinc-900' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5.5 pb-5 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white relative overflow-hidden border-t border-zinc-900">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-sans font-extrabold tracking-tight text-white">
            Ready to streamline your business loop?
          </h2>
          <p className="mt-4 text-zinc-400 max-w-lg mx-auto text-sm sm:text-base">
            Start tracking clients, appointments, and payments in a clean, effortless system today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-zinc-950 px-8 py-3.5 rounded-xl font-bold hover:bg-zinc-100 transition-all text-sm shadow-[0_2px_12px_rgba(255,255,255,0.15)] cursor-pointer"
            >
              Register New Business Free
              <ArrowRight className="w-4 h-4 text-zinc-900" />
            </Link>

            <button
              onClick={() => signInAsDemo()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700/80 px-6 py-3.5 rounded-xl font-bold transition-all text-sm cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Try Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zinc-950 text-zinc-500 text-xs border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo href="/" size="sm" light />
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>Clean CRM for Indian enterprises & trades</span>
          </div>
          <div>
            &copy; 2026 ServiceLoop. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
