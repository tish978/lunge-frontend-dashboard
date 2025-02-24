import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function Dashboard() {
    const [workouts, setWorkouts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Authentication token is missing. Please log in.");
            return null;
        }
        return { Authorization: `Bearer ${token}` };
    };

    const fetchWorkouts = async (query = "") => {
        setLoading(true);
        setError("");

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await axios.get(`${BASE_URL}/api/admin/workouts?query=${query}`, { headers });

            if (response.status !== 200) throw new Error("Unexpected response from server");

            setWorkouts(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch workouts. Please try again.");
            console.error("❌ Fetch Workouts Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this workout?")) return;
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            await axios.delete(`${BASE_URL}/api/admin/workouts/${id}`, { headers });

            setWorkouts(workouts.filter((workout) => workout.id !== id));
        } catch (error) {
            setError("Failed to delete workout. Please try again.");
            console.error("❌ Delete Error:", error.response ? error.response.data : error);
        }
    };

    const handleEdit = (workout) => {
        setEditingWorkout(workout);
        setShowEditModal(true);
    };

    const validateWorkout = (workout) => {
        if (!workout.workout_type || workout.workout_type.length < 3) return "Workout type must be at least 3 characters";
        if (!workout.duration || isNaN(workout.duration) || workout.duration <= 0) return "Duration must be a positive number";
        if (!workout.calories_burned || isNaN(workout.calories_burned) || workout.calories_burned <= 0) return "Calories burned must be a positive number";
        return null;
    };

    const handleUpdate = async () => {
        const validationError = validateWorkout(editingWorkout);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            await axios.put(`${BASE_URL}/api/admin/workouts/${editingWorkout.id}`, editingWorkout, { headers });

            setWorkouts(workouts.map((w) => (w.id === editingWorkout.id ? editingWorkout : w)));
            setShowEditModal(false);
            setError("");
        } catch (error) {
            setError("Failed to update workout. Please try again.");
            console.error("❌ Update Error:", error.response ? error.response.data : error);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Admin Dashboard</h2>

            {/* 🔍 Search Bar */}
            <input
                type="text"
                placeholder="Search by user..."
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchWorkouts(e.target.value);
                }}
                style={{ marginBottom: "10px", padding: "8px", width: "100%" }}
            />

            {error && <div style={{ color: "red", backgroundColor: "#ffdddd", padding: "10px", marginBottom: "10px" }}>{error}</div>}
            {loading && <p>Loading workouts...</p>}

            <table border="1" width="100%">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Workout Type</th>
                        <th>Duration</th>
                        <th>Calories Burned</th>
                        <th>Image</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {workouts.map((workout) => (
                        <tr key={workout.id}>
                            <td>{workout.user_name}</td>
                            <td>{workout.user_email}</td>
                            <td>{workout.workout_type}</td>
                            <td>{workout.duration} min</td>
                            <td>{workout.calories_burned} cal</td>
                            <td>
                                <img
                                    src={workout.image_url || "https://via.placeholder.com/100"}
                                    alt="Workout"
                                    width="100"
                                    onError={(e) => (e.target.src = "https://via.placeholder.com/100")}
                                />
                            </td>
                            <td>
                                <button onClick={() => handleEdit(workout)}>Edit</button>
                                <button onClick={() => handleDelete(workout.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showEditModal && (
                <div className="modal">
                    <h3>Edit Workout</h3>
                    <input
                        type="text"
                        value={editingWorkout.workout_type}
                        onChange={(e) => setEditingWorkout({ ...editingWorkout, workout_type: e.target.value })}
                    />
                    <input
                        type="number"
                        value={editingWorkout.duration}
                        onChange={(e) => setEditingWorkout({ ...editingWorkout, duration: e.target.value })}
                    />
                    <input
                        type="number"
                        value={editingWorkout.calories_burned}
                        onChange={(e) => setEditingWorkout({ ...editingWorkout, calories_burned: e.target.value })}
                    />
                    <button onClick={handleUpdate}>Save</button>
                    <button onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
