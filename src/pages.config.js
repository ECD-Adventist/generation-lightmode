/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import AdminCenter from './pages/AdminCenter';
import AdminReports from './pages/AdminReports';
import Assistant from './pages/Assistant';
import Challenges from './pages/Challenges';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import GlobalReach from './pages/GlobalReach';
import GlowGroups from './pages/GlowGroups';
import GroupSession from './pages/GroupSession';
import Home from './pages/Home';
import Impact from './pages/Impact';
import Live from './pages/Live';
import Media from './pages/Media';
import Messages from './pages/Messages';
import Milestones from './pages/Milestones';
import Notifications from './pages/Notifications';
import Post from './pages/Post';
import PrayerWall from './pages/PrayerWall';
import Profile from './pages/Profile';
import Resources from './pages/Resources';
import Saved from './pages/Saved';
import KeepIt100 from './pages/KeepIt100';
import FaithQuiz from './pages/FaithQuiz';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminCenter": AdminCenter,
    "AdminReports": AdminReports,
    "Assistant": Assistant,
    "Challenges": Challenges,
    "Dashboard": Dashboard,
    "Feed": Feed,
    "GlobalReach": GlobalReach,
    "GlowGroups": GlowGroups,
    "GroupSession": GroupSession,
    "Home": Home,
    "Impact": Impact,
    "Live": Live,
    "Media": Media,
    "Messages": Messages,
    "Milestones": Milestones,
    "Notifications": Notifications,
    "Post": Post,
    "PrayerWall": PrayerWall,
    "Profile": Profile,
    "Resources": Resources,
    "Saved": Saved,
    "KeepIt100": KeepIt100,
    "FaithQuiz": FaithQuiz,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};