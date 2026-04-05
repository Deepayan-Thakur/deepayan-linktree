import { LucideIcon } from 'lucide-react';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  color?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  tags: string[];
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  profileName: string;
  profileBio: string;
  profileImage: string;
}
