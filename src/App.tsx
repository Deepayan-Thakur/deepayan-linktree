/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Plus,
  ExternalLink,
  Settings2,
  Trash2,
  LayoutGrid,
  Link as LinkIcon,
  X,
  Code,
  Smartphone,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkItem, ProjectItem, ThemeConfig } from './types';
import { syncDataToGist, syncDataFromGist, StorageData } from './utils/gistStorage';

const INITIAL_LINKS: LinkItem[] = [];

const INITIAL_PROJECTS: ProjectItem[] = [];

const STORAGE_VERSION = '2';
const STORAGE_VERSION_KEY = 'dt_storage_version';

function clearLegacyStorage() {
  if (typeof window === 'undefined') return;
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion !== STORAGE_VERSION) {
    localStorage.removeItem('dt_links');
    localStorage.removeItem('dt_projects');
    localStorage.removeItem('dt_theme');
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  }
}


const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  accentColor: '#ec4899',
  backgroundColor: '#0f172a',
  profileName: 'Deepayan Thakur',
  profileBio: 'Software Development Engineer | AiML Engineer',
  profileImage: 'https://github.com/Deepayan-Thakur.png',
};

const IconMap: Record<string, React.ElementType> = {
  Github, Twitter, Linkedin, Instagram, Globe, Code, Smartphone, Layers, Link: LinkIcon
};

export default function App() {
  const [links, setLinks] = useState<LinkItem[]>(() => {
    clearLegacyStorage();
    const saved = localStorage.getItem('dt_links');
    const parsed = saved ? JSON.parse(saved) : INITIAL_LINKS;
    return parsed;
  });

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    clearLegacyStorage();
    const saved = localStorage.getItem('dt_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [theme, setTheme] = useState<ThemeConfig>(() => {
    clearLegacyStorage();
    const saved = localStorage.getItem('dt_theme');
    const parsed = saved ? JSON.parse(saved) : {};
    // Force profile info to update while keeping any custom colors the user might have saved
    return {
      ...DEFAULT_THEME,
      ...parsed,
      profileName: DEFAULT_THEME.profileName,
      profileBio: DEFAULT_THEME.profileBio,
      profileImage: DEFAULT_THEME.profileImage
    };
  });

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [activeTab, setActiveTab] = useState<'links' | 'projects'>('links');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChecking, setPasswordChecking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'links' | 'projects' | null>(null);

  // Helper function to create storage data object
  const createStorageData = (l: LinkItem[], p: ProjectItem[], t: ThemeConfig): StorageData => ({
    links: l,
    projects: p,
    theme: t,
    timestamp: new Date().toISOString(),
  });

  const openAdminAction = (action: 'links' | 'projects') => {
    if (isAdmin) {
      if (action === 'links') {
        setIsAddingLink(true);
      } else {
        setIsAddingProject(true);
      }
      return;
    }

    setPendingAction(action);
    setPasswordError(null);
    setPasswordInput('');
    setIsPasswordModalOpen(true);
  };

  const verifyPassword = async () => {
    setPasswordError(null);
    setPasswordChecking(true);

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPasswordError(data.error || 'Password is incorrect');
        return false;
      }

      setIsAdmin(true);
      return true;
    } catch (error) {
      setPasswordError('Unable to verify password. Please try again.');
      return false;
    } finally {
      setPasswordChecking(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data from GitHub Gist on mount
  useEffect(() => {
    const loadFromGistOnMount = async () => {
      try {
        const localData = createStorageData(links, projects, theme);
        const latestData = await syncDataFromGist(localData);
        
        if (latestData && (latestData.links !== links || latestData.projects !== projects)) {
          setLinks(latestData.links);
          setProjects(latestData.projects);
          setTheme(latestData.theme || theme);
          console.log('✅ Loaded data from GitHub Gist');
        }
      } catch (error) {
        console.warn('⚠️ Could not load from Gist, using local data:', error);
      }
    };

    loadFromGistOnMount();
  }, []); // Run only on mount

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#projects') {
      setActiveTab('projects');
    } else if (hash === '#links') {
      setActiveTab('links');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dt_links', JSON.stringify(links));
    syncDataToGist(createStorageData(links, projects, theme));
  }, [links]);

  useEffect(() => {
    localStorage.setItem('dt_projects', JSON.stringify(projects));
    syncDataToGist(createStorageData(links, projects, theme));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('dt_theme', JSON.stringify(theme));
    syncDataToGist(createStorageData(links, projects, theme));
  }, [theme]);

  const addLink = (newLink: Omit<LinkItem, 'id'>) => {
    setLinks(prev => [...prev, { ...newLink, id: Date.now().toString() }]);
    setIsAddingLink(false);
  };

  const addProject = (newProject: Omit<ProjectItem, 'id'>) => {
    setProjects(prev => [...prev, { ...newProject, id: Date.now().toString() }]);
    setIsAddingProject(false);
  };

  const deleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden font-sans text-white selection:bg-white/30 pb-24"
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: `radial-gradient(circle at 0% 0%, ${theme.primaryColor}33 0%, transparent 50%), 
                          radial-gradient(circle at 100% 100%, ${theme.secondaryColor}33 0%, transparent 50%),
                          radial-gradient(circle at 50% 50%, ${theme.accentColor}11 0%, transparent 50%)`
      }}
    >
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[120px]"
          style={{ backgroundColor: theme.primaryColor + '22' }}
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ backgroundColor: theme.secondaryColor + '22' }}
        />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center">
        {/* Profile Section */}
        <motion.div
          id="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-12 w-full"
        >
          {/* Live Time Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-[10px] font-mono text-white/60 tracking-[0.2em] uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </motion.div>

          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 rounded-full blur-xl opacity-50"
              style={{ backgroundImage: `conic-gradient(from 0deg, ${theme.primaryColor}, ${theme.accentColor}, ${theme.secondaryColor}, ${theme.primaryColor})` }}
            ></motion.div>
            <div
              className="relative p-1 rounded-full"
              style={{ backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}
            >
              <img
                src={theme.profileImage}
                alt={theme.profileName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/20 object-cover shadow-2xl bg-slate-900"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="mt-8 text-3xl sm:text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {theme.profileName}
          </h1>
          <p className="mt-2 text-white/60 font-medium tracking-wide max-w-xs sm:max-w-md">
            {theme.profileBio}
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex p-1 glass rounded-full mb-8 w-full max-w-xs">
          <button
            onClick={() => setActiveTab('links')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all duration-300 ${activeTab === 'links' ? 'shadow-lg text-white' : 'text-white/50 hover:text-white/80'}`}
            style={{ backgroundColor: activeTab === 'links' ? theme.primaryColor + '66' : 'transparent' }}
          >
            <LinkIcon size={18} />
            <span className="text-sm font-bold">Links</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full transition-all duration-300 ${activeTab === 'projects' ? 'shadow-lg text-white' : 'text-white/50 hover:text-white/80'}`}
            style={{ backgroundColor: activeTab === 'projects' ? theme.primaryColor + '66' : 'transparent' }}
          >
            <LayoutGrid size={18} />
            <span className="text-sm font-bold">Projects</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'links' ? (
              <motion.div
                id="links"
                key="links"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-3xl border border-dashed border-white/10 text-white/50 bg-white/5">
                    <div className="text-2xl">✦</div>
                    <p className="text-center max-w-xs">No links yet. Add your first link so it appears on your public page.</p>
                  </div>
                ) : (
                  links.map((link, index) => (
                    <motion.a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative flex items-center p-4 glass rounded-2xl transition-all duration-300 hover:bg-white/15 active:scale-[0.98] overflow-hidden"
                    >
                      {/* Hover Glow Effect */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                        style={{ backgroundColor: link.color || theme.primaryColor }}
                      ></div>

                      <div
                        className="w-12 h-12 flex items-center justify-center rounded-xl text-white/80 transition-colors"
                        style={{ backgroundColor: (link.color || theme.primaryColor) + '33' }}
                      >
                        {React.createElement(IconMap[link.icon] || LinkIcon, { size: 24 })}
                      </div>

                      <div className="ml-4 flex-1">
                        <h3 className="font-display font-semibold text-lg group-hover:translate-x-1 transition-transform duration-300">
                          {link.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <ExternalLink size={18} className="text-white/20 group-hover:text-white/80 transition-colors" />
                      </div>
                    </motion.a>
                  ))
                )}

                <button
                  onClick={() => openAdminAction('links')}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl text-white/40 hover:text-white transition-all group"
                  style={{ borderColor: theme.primaryColor + '33' }}
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold">Add New Link</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                id="projects"
                key="projects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-3xl border border-dashed border-white/10 text-white/50 bg-white/5 col-span-full">
                    <div className="text-2xl">✦</div>
                    <p className="text-center max-w-xs">No projects yet. Add your first project when you're ready.</p>
                  </div>
                ) : (
                  projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative glass rounded-2xl overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video overflow-hidden relative">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <a
                            href={project.url}
                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                          >
                            <ExternalLink size={20} />
                          </a>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-display font-bold text-lg mb-1">{project.title}</h3>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{project.description}</p>
                        <div className="mt-auto flex flex-wrap gap-2">
                          {project.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white/10 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                <button
                  onClick={() => openAdminAction('projects')}
                  className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-2xl text-white/40 hover:text-white transition-all group min-h-[200px]"
                  style={{ borderColor: theme.primaryColor + '33' }}
                >
                  <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold">Add Project</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isAddingLink && (
            <Modal title="Add New Link" onClose={() => setIsAddingLink(false)}>
              <AddLinkForm onSubmit={addLink} />
            </Modal>
          )}

          {isAddingProject && (
            <Modal title="Add New Project" onClose={() => setIsAddingProject(false)}>
              <AddProjectForm onSubmit={addProject} />
            </Modal>
          )}

          {isPasswordModalOpen && (
            <Modal
              title={pendingAction === 'projects' ? 'Admin password required' : 'Admin password required'}
              onClose={() => setIsPasswordModalOpen(false)}
            >
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const valid = await verifyPassword();
                  if (!valid || !pendingAction) return;

                  setIsPasswordModalOpen(false);
                  if (pendingAction === 'links') {
                    setIsAddingLink(true);
                  } else {
                    setIsAddingProject(true);
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    disabled={passwordChecking}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Enter admin password"
                  />
                </div>
                {passwordError && <p className="text-sm text-red-300">{passwordError}</p>}
                <button
                  type="submit"
                  disabled={passwordChecking}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  {passwordChecking ? 'Verifying...' : 'Verify password'}
                </button>
              </form>
            </Modal>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer id="footer" className="relative z-10 py-12 text-center text-white/30 text-sm px-6">
        <p>© {new Date().getFullYear()} {theme.profileName}. Built with Passion.</p>
      </footer>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md glass rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-display font-bold mb-6">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function AddLinkForm({ onSubmit }: { onSubmit: (link: Omit<LinkItem, 'id'>) => void }) {
  const [formData, setFormData] = useState({ title: '', url: '', icon: 'Link', color: '#6366f1' });

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Title</label>
        <input
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
          placeholder="e.g. My Portfolio"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">URL</label>
        <input
          required
          type="url"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
          placeholder="https://..."
          value={formData.url}
          onChange={e => setFormData({ ...formData, url: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Icon</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors appearance-none"
            value={formData.icon}
            onChange={e => setFormData({ ...formData, icon: e.target.value })}
          >
            {Object.keys(IconMap).map(icon => (
              <option key={icon} value={icon} className="bg-slate-900">{icon}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-1">Color</label>
          <input
            type="color"
            className="w-full h-[50px] bg-white/5 border border-white/10 rounded-xl px-2 py-1 focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
            value={formData.color}
            onChange={e => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
      >
        Create Link
      </button>
    </form>
  );
}

function AddProjectForm({ onSubmit }: { onSubmit: (project: Omit<ProjectItem, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image: 'https://picsum.photos/seed/new-proj/600/400',
    tags: ''
  });

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, tags: formData.tags.split(',').map(t => t.trim()) }); }}>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Project Title</label>
        <input
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
          placeholder="e.g. Awesome App"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Description</label>
        <textarea
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors min-h-[100px]"
          placeholder="What does it do?"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">URL</label>
        <input
          required
          type="url"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
          placeholder="https://..."
          value={formData.url}
          onChange={e => setFormData({ ...formData, url: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1">Tags (comma separated)</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
          placeholder="React, Node, AI"
          value={formData.tags}
          onChange={e => setFormData({ ...formData, tags: e.target.value })}
        />
      </div>
      <button
        type="submit"
        className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
      >
        Add Project
      </button>
    </form>
  );
}

