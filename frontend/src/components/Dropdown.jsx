import {useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const Dropdown = ({ title, links, isOpen, onClose, icon }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    return (
        <div className={`dropdown ${isOpen ? 'show' : ''}`} ref={dropdownRef}>
            <button
                className="nav-link dropdown-toggle"
                onClick={onClose}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {icon} {title}
            </button>
            <ul className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
                {links.map((link, index) => (
                    <li key={index}>
                        <Link
                            className="dropdown-item"
                            to={link.path}
                            onClick={onClose}
                        >
                            {link.icon} {link.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

Dropdown.propTypes = {
    title: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string.isRequired,
            path: PropTypes.string.isRequired,
            icon: PropTypes.node
        })
    ).isRequired,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    icon: PropTypes.node,
};

export default Dropdown;