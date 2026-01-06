import React, {useState, useEffect} from 'react'

import { BiUserPlus, BiUserCheck } from 'react-icons/bi';

export default function AdminDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleCreateTeacher = (e) => {
    e.preventDefault();
    // Call API to create teacher
    const createdTeacher = { ...newTeacher, id: Date.now() };
    setTeachers([...teachers, createdTeacher]);
    setNewTeacher({ name: '', email: '', password: '' });
    setShowCreateForm(false);
  };

  return (
    <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <button onClick={() => setShowCreateForm(true)}>
            <BiUserPlus /> Add Teacher
        </button>
        {showCreateForm && (
            <form onSubmit={handleCreateTeacher}>
            <input
                type="text"
                placeholder="Name"
                />   
            <input
                type="text"
                placeholder="Name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                required
            />
            <button type="submit">
                <BiUserCheck /> Create Teacher
            </button>
            </form>
        )}
        <h2>Teachers List</h2>
        <ul>
            {teachers.map((teacher) => (
            <li key={teacher.id}>{teacher.name} - {teacher.email}</li>
            ))}
        </ul>
    </div>
  );
}