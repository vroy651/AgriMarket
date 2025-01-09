import { useState, useEffect } from "react";
import {api} from "../api";
import { useAuth } from "../contexts/AuthContext";
import "./styles/UserProfilePage.css" // Import the style sheet
import {ClipLoader} from "react-spinners";
const UserProfilePage = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Add state for editing mode
  const { authTokens } = useAuth();


  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
          // Assuming your backend has an endpoint to fetch the user's profile
          const response = await api.get("/users/me/", {
            headers: { Authorization: `Bearer ${authTokens?.access}` },
          });
          if(response.status === 200){
               setUserProfile(response.data);
          } else{
              setFetchError(`Failed to fetch user profile. Status: ${response.status}`);
          }
        } catch (error) {
            console.error("Error during user profile fetch:", error);
            setFetchError(`Error fetching user profile. Please try again later.`);
        } finally{
          setIsLoading(false);
        }
    };

    if (authTokens?.access) {
      fetchUserProfile();
    } else {
        setIsLoading(false);
      setFetchError("Authentication token not found. Please login.");
    }
  }, [authTokens]);


    const handleEditClick = () => {
        setIsEditing(true);
      };

    const handleSaveClick = () => {
        // Here goes the logic for saving data.
        setIsEditing(false);
    }

  if (isLoading) {
    return (
        <div className="loading-container">
        <ClipLoader color={"#007bff"} loading={true} size={50}/>
        <p>Loading profile...</p>
    </div>
    );
  }

  if (fetchError) {
      return <div className="error-message">Error: {fetchError}</div>;
  }
    const renderProfileDetails = () => (
        <div className="profile-details">
            <p>
                <strong>Username:</strong> {userProfile?.username || "N/A"}
            </p>
            <p>
                <strong>Email:</strong> {userProfile?.email || "N/A"}
            </p>
            <p>
                <strong>Location:</strong> {userProfile?.location || "N/A"}
            </p>
            {/* Add other user profile details here */}
        </div>
    );
  return (
    <div className="user-profile-page">
      <h2>My Profile</h2>
          {isEditing ? (
                <div className="profile-details">
                    {/* Add input fields for editing user profile information here */}
                    <button className="button save-button" onClick={handleSaveClick}>Save</button>
                </div>
            ) : (
                <>
                   {renderProfileDetails()}
                    <button className="button edit-button" onClick={handleEditClick}>Edit Profile</button>
                </>
            )}
    </div>
  );
};

export default UserProfilePage;