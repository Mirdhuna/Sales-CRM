import React from "react";
import { FaBars, FaBell, FaEnvelope } from "react-icons/fa";
import "../css/Topbar.css";
import { logout,getUser } from "../services/loginService";
import { useNavigate } from "react-router-dom";


function Topbar({title}) {
    const navigate=useNavigate();
    const user=getUser();
    const handleLogout = () => {
        logout();
        navigate("/login");
    }
 
    return (
        <div className="topbar">
            {/* Left side */}
            <div className="topbar-left">
                <FaBars className="menu-icon" />
                <h2>{title}</h2>
            </div>

            {/* Right side */}
            <div className="topbar-right">
                {/* FIX: wrap icons in .icon-container and use .top-icon class
                    to match the CSS that was already defined for them */}
                <div className="icon-container">
                    <FaBell className="top-icon" />
                </div>

                <div className="icon-container">
                    <FaEnvelope className="top-icon" />
                </div>

                {/* Profile */}
                <div className="profile-section">
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYI0bqxoChAPtKdKt6_u3bMhbEYTDV6Pw-FA&s"
                        alt="profile"
                    />
                    <div className="profile-info">
                        <h4>{user?.name || "Guest User"}</h4>
                        <p>{user?.role || "Unknown Role"}</p>
                    </div>
                </div>
                <div>
                    <button className="logbtn" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </div>
    );
}

export default Topbar;