'use client';

import React, { useState } from 'react';
import { Search, X, ArrowRight, Tag, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const categories = [
    { label: 'Next.js Apps', query: 'nextjs' },
    { label: 'React Boilerplates', query: 'boilerplate' },
    { label: 'Mobile Apps', query: 'mobile' },
    { label: 'Tailwind Templates', query: 'tailwind' },
    { label: 'API Services', query: 'api' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F0E1E]/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-float)] p-4 sm:p-6 z-10 text-[var(--text-primary)]"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center mb-4">
              <Search className="w-5 h-5 text-[var(--text-muted)] absolute left-4" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps, boilerplates, templates, tech stack..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lilac-accent)]/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <Tag className="w-3.5 h-3.5" />
                <span>Popular Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.query}
                    type="button"
                    onClick={() => {
                      navigate(`/explore?category=${cat.query}`);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--lilac-surface)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-[var(--lilac-accent)]" />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Press Enter to search</span>
              <button
                type="button"
                onClick={() => {
                  navigate('/explore');
                  onClose();
                }}
                className="flex items-center gap-1 text-[var(--primary-coral)] hover:underline font-semibold"
              >
                <span>Browse all software</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
