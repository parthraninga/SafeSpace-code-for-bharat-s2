// import React, { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { Bars3Icon, XMarkIcon, UserCircleIcon, SunIcon, MoonIcon, BellIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
// import { useAuth } from "../../context/AuthContext";
// import { useTheme } from "../../context/ThemeContext";
// import NotificationModal from "../modals/NotificationModal";
// import ProfileModal from "../modals/ProfileModal";

// const Navbar = () => {
//     const [isMenuOpen, setIsMenuOpen] = useState(false);
//     const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
//     const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
//     const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
//     const [profileImageError, setProfileImageError] = useState(false);
//     const { user, isAuthenticated, logout } = useAuth();
//     const { isDark, toggleTheme } = useTheme();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const isAuthPage = ["/login", "/signup"].includes(location.pathname);

//     const handleLogout = async () => {
//         await logout();
//         navigate("/");
//         setIsProfileMenuOpen(false);
//     };

//     const navigation = [
//         { name: "Dashboard", href: "/dashboard", auth: true },
//         { name: "Map", href: "/map", auth: true },
//         { name: "Threats", href: "/threats", auth: true },
//         { name: "Profile", href: "/profile", auth: true },
//     ];

//     const publicNavigation = [
//         { name: "Home", href: "/" },
//         { name: "About", href: "/about" },
//         { name: "Features", href: "/features" },
//         { name: "Contact", href: "/contact" },
//     ];

//     if (isAuthPage) {
//         return null; // Don't show navbar on auth pages
//     }

//     const handleImageError = () => {
//         setProfileImageError(true);
//     };

//     const renderProfileAvatar = () => {
//         const hasProfilePic = user?.profilePic?.url && !profileImageError;

//         if (hasProfilePic) {
//             return (
//                 <img
//                     src={user.profilePic.url}
//                     alt={`${user?.name || "User"}'s profile`}
//                     className="h-6 w-6 rounded-full object-cover border border-gray-300 shadow-sm"
//                     onError={handleImageError}
//                     onLoad={() => setProfileImageError(false)} // Reset error state on successful load
//                 />
//             );
//         }

//         return <UserCircleIcon className="h-6 w-6" />;
//     };

//     return (
//         <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="flex justify-between h-16">
//                     {/* Logo and brand */}
//                     <div className="flex items-center">
//                         <Link to="/" className="flex items-center space-x-2">
//                             <motion.div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                                 <ShieldCheckIcon className="h-5 w-5 text-white" />
//                             </motion.div>
//                             <span className="text-xl font-bold text-gray-900 dark:text-white">SafeSpace</span>
//                         </Link>
//                     </div>

//                     {/* Desktop Navigation */}
//                     <div className="hidden md:flex items-center space-x-8">
//                         {isAuthenticated
//                             ? // Authenticated navigation
//                               navigation.map((item) => (
//                                   <Link
//                                       key={item.name}
//                                       to={item.href}
//                                       className={`${
//                                           location.pathname === item.href
//                                               ? "text-primary-600 border-b-2 border-primary-600"
//                                               : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
//                                       } px-3 py-2 text-sm font-medium transition-colors border-b-2 border-transparent`}>
//                                       {item.name}
//                                   </Link>
//                               ))
//                             : // Public navigation
//                               publicNavigation.map((item) => (
//                                   <Link
//                                       key={item.name}
//                                       to={item.href}
//                                       className={`${location.pathname === item.href ? "text-primary-600" : "text-gray-600 hover:text-gray-900"} px-3 py-2 text-sm font-medium transition-colors`}>
//                                       {item.name}
//                                   </Link>
//                               ))}
//                     </div>

//                     {/* Right side buttons */}
//                     <div className="flex items-center space-x-4">
//                         {/* Theme toggle */}
//                         <motion.button
//                             onClick={toggleTheme}
//                             className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
//                             {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
//                         </motion.button>

//                         {isAuthenticated ? (
//                             <>
//                                 {/* Notifications */}
//                                 <motion.button
//                                     onClick={() => setIsNotificationModalOpen(true)}
//                                     className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
//                                     whileHover={{ scale: 1.05 }}
//                                     whileTap={{ scale: 0.95 }}>
//                                     <BellIcon className="h-5 w-5" />
//                                     <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
//                                 </motion.button>

//                                 {/* Profile dropdown */}
//                                 <div className="relative">
//                                     <motion.button
//                                         onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
//                                         className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
//                                         whileHover={{ scale: 1.05 }}
//                                         whileTap={{ scale: 0.95 }}>
//                                         {renderProfileAvatar()}
//                                         <span className="hidden md:block text-sm font-medium">{user?.name || "User"}</span>
//                                     </motion.button>

//                                     <AnimatePresence>
//                                         {isProfileMenuOpen && (
//                                             <motion.div
//                                                 initial={{ opacity: 0, y: -10 }}
//                                                 animate={{ opacity: 1, y: 0 }}
//                                                 exit={{ opacity: 0, y: -10 }}
//                                                 className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
//                                                 {/* Profile menu header with larger avatar */}
//                                                 <div className="px-4 py-3 border-b border-gray-100">
//                                                     <div className="flex items-center space-x-3">
//                                                         {user?.profilePic?.url && !profileImageError ? (
//                                                             <img
//                                                                 src={user.profilePic.url}
//                                                                 alt={`${user?.name || "User"}'s profile`}
//                                                                 className="h-10 w-10 rounded-full object-cover border border-gray-300"
//                                                                 onError={handleImageError}
//                                                             />
//                                                         ) : (
//                                                             <UserCircleIcon className="h-10 w-10 text-gray-400" />
//                                                         )}
//                                                         <div className="flex-1 min-w-0">
//                                                             <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
//                                                             <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//                                                         </div>
//                                                     </div>
//                                                 </div>

//                                                 <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsProfileMenuOpen(false)}>
//                                                     Your Profile
//                                                 </Link>
//                                                 <button
//                                                     onClick={() => {
//                                                         setIsProfileModalOpen(true);
//                                                         setIsProfileMenuOpen(false);
//                                                     }}
//                                                     className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
//                                                     Account Settings
//                                                 </button>
//                                                 <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsProfileMenuOpen(false)}>
//                                                     Settings
//                                                 </Link>
//                                                 <hr className="my-1" />
//                                                 <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
//                                                     Sign out
//                                                 </button>
//                                             </motion.div>
//                                         )}
//                                     </AnimatePresence>
//                                 </div>
//                             </>
//                         ) : (
//                             <>
//                                 {/* Login/Signup buttons */}
//                                 <Link to="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
//                                     Sign in
//                                 </Link>
//                                 <Link to="/signup" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
//                                     Get Started
//                                 </Link>
//                             </>
//                         )}

//                         {/* Mobile menu button */}
//                         <motion.button
//                             onClick={() => setIsMenuOpen(!isMenuOpen)}
//                             className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}>
//                             {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
//                         </motion.button>
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile menu */}
//             <AnimatePresence>
//                 {isMenuOpen && (
//                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-gray-200">
//                         <div className="px-2 pt-2 pb-3 space-y-1">
//                             {(isAuthenticated ? navigation : publicNavigation).map((item) => (
//                                 <Link
//                                     key={item.name}
//                                     to={item.href}
//                                     className={`${
//                                         location.pathname === item.href ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
//                                     } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
//                                     onClick={() => setIsMenuOpen(false)}>
//                                     {item.name}
//                                 </Link>
//                             ))}

//                             {!isAuthenticated && (
//                                 <div className="pt-4 pb-2 border-t border-gray-200 space-y-1">
//                                     <Link
//                                         to="/login"
//                                         className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
//                                         onClick={() => setIsMenuOpen(false)}>
//                                         Sign in
//                                     </Link>
//                                     <Link
//                                         to="/signup"
//                                         className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
//                                         onClick={() => setIsMenuOpen(false)}>
//                                         Get Started
//                                     </Link>
//                                 </div>
//                             )}
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//             {/* Modals */}
//             <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />
//             <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
//         </nav>
//     );
// };

// export default Navbar;

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon, UserCircleIcon, SunIcon, MoonIcon, BellIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationModal from "../modals/NotificationModal";
import ProfileModal from "../modals/ProfileModal";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const { user, isAuthenticated, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthPage = ["/login", "/signup"].includes(location.pathname);

    // Add scroll detection
    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Add body scroll lock when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        await logout();
        navigate("/");
        setIsProfileMenuOpen(false);
    };

    const navigation = [
        { name: "Dashboard", href: "/dashboard", auth: true },
        { name: "Map", href: "/map", auth: true },
        { name: "Threats", href: "/threats", auth: true },
        { name: "Profile", href: "/profile", auth: true },
    ];

    const publicNavigation = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Features", href: "/features" },
        { name: "Contact", href: "/contact" },
    ];

    const handleImageError = () => {
        setProfileImageError(true);
    };

    const renderProfileAvatar = () => {
        const hasProfilePic = user?.profilePic?.url && !profileImageError;

        if (hasProfilePic) {
            return (
                <motion.img
                    src={user.profilePic.url}
                    alt={`${user?.name || "User"}'s profile`}
                    className="h-8 w-8 rounded-full object-cover border border-gray-300 shadow-sm"
                    onError={handleImageError}
                    onLoad={() => setProfileImageError(false)}
                    whileHover={{ scale: 1.1 }}
                />
            );
        }

        return (
            <motion.div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center" whileHover={{ scale: 1.1 }}>
                <UserCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </motion.div>
        );
    };

    // Skip rendering navbar on auth pages
    if (isAuthPage) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="flex justify-center w-full">
                <motion.nav
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`transition-all duration-500 ease-in-out ${
                        isScrolled
                            ? "mt-4 py-2 px-4 w-[90%] max-w-5xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg shadow-primary-500/10 border border-gray-200/50 dark:border-gray-800/50 rounded-[1.4rem]"
                            : "py-5 px-6 w-full max-w-7xl bg-transparent"
                    }`}>
                    <div className="flex items-center justify-between">
                        {/* Logo and brand */}
                        <Link to="/" className="flex items-center space-x-2 group relative">
                            {/* Glowing background effect */}
                            <motion.div
                                className="absolute -inset-2 rounded-full opacity-20"
                                animate={{
                                    background: [
                                        "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                                        "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
                                        "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
                                        "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                                    ],
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Animated icon container */}
                            <motion.div
                                className={`relative transition-all duration-500 rounded-full ${isScrolled ? "bg-primary-900/30 dark:bg-primary-900/30 p-1.5" : ""}`}
                                whileHover={{
                                    scale: 1.15,
                                    rotate: [0, -5, 5, 0],
                                }}
                                animate={{
                                    boxShadow: [
                                        "0 0 0px 0px rgba(59,130,246,0)",
                                        "0 0 15px 3px rgba(59,130,246,0.3)",
                                        "0 0 20px 5px rgba(139,92,246,0.2)",
                                        "0 0 15px 3px rgba(59,130,246,0.3)",
                                        "0 0 0px 0px rgba(59,130,246,0)",
                                    ],
                                }}
                                transition={{
                                    boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                    scale: { duration: 0.2 },
                                    rotate: { duration: 0.3 },
                                }}>
                                {/* Rotating ring effect */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Shield icon */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}>
                                    <ShieldCheckIcon
                                        className={`transition-all duration-500 text-primary-500 dark:text-primary-400 group-hover:text-primary-400 dark:group-hover:text-primary-300 relative z-10 ${
                                            isScrolled ? "h-6 w-6" : "h-7 w-7"
                                        }`}
                                    />
                                </motion.div>

                                {/* Pulse particles */}
                                <motion.div
                                    className="absolute top-1 right-1 w-1 h-1 bg-primary-400 rounded-full"
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 0.5,
                                    }}
                                />
                                <motion.div
                                    className="absolute bottom-1 left-1 w-1 h-1 bg-purple-400 rounded-full"
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 1,
                                    }}
                                />
                            </motion.div>

                            {/* Animated text */}
                            <div className={`font-bold transition-all duration-500 ${isScrolled ? "text-lg" : "text-2xl"} flex relative`}>
                                {/* Text shadow effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-400 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent blur-sm opacity-50"
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}>
                                    SafeSpace
                                </motion.div>

                                {/* Main text with floating letters */}
                                {"SafeSpace".split("").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        className="bg-gradient-to-r from-primary-500 to-blue-500 dark:from-primary-400 dark:to-blue-400 bg-clip-text text-transparent relative z-10"
                                        style={{ display: "inline-block", whiteSpace: "pre" }}
                                        animate={{
                                            y: [0, -4, 0],
                                            textShadow: ["0px 0px 0px rgba(59,130,246,0)", "0px 2px 8px rgba(59,130,246,0.4)", "0px 0px 0px rgba(59,130,246,0)"],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.1,
                                        }}
                                        whileHover={{
                                            scale: 1.2,
                                            color: "#60a5fa",
                                            transition: { duration: 0.2 },
                                        }}>
                                        {char}
                                    </motion.span>
                                ))}

                                {/* Sparkle effects */}
                                <motion.div
                                    className="absolute -top-1 -right-2 text-primary-400 text-xs"
                                    animate={{
                                        scale: [0, 1, 0],
                                        rotate: [0, 180, 360],
                                        opacity: [0, 1, 0],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: 1.5,
                                    }}>
                                    ✨
                                </motion.div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {(isAuthenticated ? navigation : publicNavigation).map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-1 ${
                                        location.pathname === item.href
                                            ? "bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium border border-primary-700/30"
                                            : "text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-900/10 dark:hover:bg-primary-900/20"
                                    }`}>
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {!isAuthenticated && (
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        to="/signup"
                                        className="ml-2 px-5 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200 flex items-center space-x-1">
                                        <span>Get Started</span>
                                    </Link>
                                </motion.button>
                            )}
                        </div>

                        {/* Right side buttons */}
                        <div className="flex items-center space-x-3">
                            {/* Theme toggle */}
                            <motion.button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                whileHover={{
                                    scale: 1.1,
                                    rotate: isDark ? -15 : 15,
                                }}
                                whileTap={{ scale: 0.9 }}
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                                {isDark ? <SunIcon className="h-5 w-5 text-yellow-400" /> : <MoonIcon className="h-5 w-5 text-blue-600" />}
                            </motion.button>

                            {isAuthenticated && (
                                <>
                                    {/* Notifications */}
                                    <motion.button
                                        onClick={() => setIsNotificationModalOpen(true)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}>
                                        <BellIcon className="h-5 w-5" />
                                        <motion.span
                                            className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: [0.8, 1.2, 0.8] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        />
                                    </motion.button>

                                    {/* Profile dropdown */}
                                    <div className="relative">
                                        <motion.button
                                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                            className="flex items-center space-x-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}>
                                            {renderProfileAvatar()}
                                        </motion.button>

                                        <AnimatePresence>
                                            {isProfileMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                    {/* Profile menu header with larger avatar */}
                                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-center space-x-3">
                                                            {user?.profilePic?.url && !profileImageError ? (
                                                                <img
                                                                    src={user.profilePic.url}
                                                                    alt={`${user?.name || "User"}'s profile`}
                                                                    className="h-10 w-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                                                                    onError={handleImageError}
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                                                    <UserCircleIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to="/profile"
                                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => setIsProfileMenuOpen(false)}>
                                                        Your Profile
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileModalOpen(true);
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        Account Settings
                                                    </button>
                                                    <Link
                                                        to="/settings"
                                                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        onClick={() => setIsProfileMenuOpen(false)}>
                                                        Settings
                                                    </Link>
                                                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                                    <button
                                                        onClick={handleLogout}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                        Sign out
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}

                            {!isAuthenticated && (
                                <div className="hidden md:block">
                                    <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                                        Sign in
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <motion.button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                            </motion.button>
                        </div>
                    </div>
                </motion.nav>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)}></div>

                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="absolute top-20 inset-x-4 z-40 md:hidden">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50">
                            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                                <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">Navigation</span>
                            </div>

                            <div className="p-4 space-y-2">
                                {(isAuthenticated ? navigation : publicNavigation).map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center space-x-2 p-3 rounded-lg ${
                                            location.pathname === item.href
                                                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-700/30"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}>
                                        <span>{item.name}</span>
                                    </Link>
                                ))}

                                {!isAuthenticated && (
                                    <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700 space-y-2 mt-2">
                                        <Link
                                            to="/login"
                                            className="flex items-center space-x-2 p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            onClick={() => setIsMenuOpen(false)}>
                                            <span>Sign in</span>
                                        </Link>

                                        <Link
                                            to="/signup"
                                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200 flex items-center justify-center"
                                            onClick={() => setIsMenuOpen(false)}>
                                            <span>Get Started</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            

            {/* Modals */}
            <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} />
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </header>
    );
};

export default Navbar;
