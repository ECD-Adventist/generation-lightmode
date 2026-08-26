import { lazy } from 'react';
import __Layout from './Layout.jsx';

const About = lazy(() => import('./pages/About'));
const AdminCenter = lazy(() => import('./pages/AdminCenter'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Challenges = lazy(() => import('./pages/Challenges'));
const CodesOfTruth = lazy(() => import('./pages/CodesOfTruth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FaithQuiz = lazy(() => import('./pages/FaithQuiz'));
const Feed = lazy(() => import('./pages/Feed'));
const GlobalReach = lazy(() => import('./pages/GlobalReach'));
const GlowGroups = lazy(() => import('./pages/GlowGroups'));
const GroupSession = lazy(() => import('./pages/GroupSession'));
const Home = lazy(() => import('./pages/Home'));
const Impact = lazy(() => import('./pages/Impact'));
const KeepIt100 = lazy(() => import('./pages/KeepIt100'));
const Live = lazy(() => import('./pages/Live'));
const Media = lazy(() => import('./pages/Media'));
const Messages = lazy(() => import('./pages/Messages'));
const Milestones = lazy(() => import('./pages/Milestones'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Post = lazy(() => import('./pages/Post'));
const PrayerWall = lazy(() => import('./pages/PrayerWall'));
const Profile = lazy(() => import('./pages/Profile'));
const Resources = lazy(() => import('./pages/Resources'));
const Saved = lazy(() => import('./pages/Saved'));

export const PAGES = {
  About, AdminCenter, AdminReports, Assistant, Challenges, CodesOfTruth,
  Dashboard, FaithQuiz, Feed, GlobalReach, GlowGroups, GroupSession, Home,
  Impact, KeepIt100, Live, Media, Messages, Milestones, Notifications, Post,
  PrayerWall, Profile, Resources, Saved,
};

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
  Layout: __Layout,
};