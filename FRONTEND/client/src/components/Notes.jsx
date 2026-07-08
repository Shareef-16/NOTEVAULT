import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Profile from './Profile';

function Notes() {
    const navigate = useNavigate();
   const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [msg, setMessage] = useState("");
const [data, setData] = useState([]);

const [search, setSearch] = useState("");
const [searchMode, setSearchMode] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        } else {
            getNotes();
        }
    }, [])

    async function getNotes() {
        const token = localStorage.getItem("token");
        try {
            const res = await axios.get("http://localhost:8000/notes",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setData(res.data.notes);
        } catch (err) {
            navigate("/login");
        }
    }
    async function searchNotes() {
    const token = localStorage.getItem("token");

    try {
        if (search.trim() === "") {
            setSearchMode(false);
            getNotes();
            return;
        }

        const res = await axios.get(
            `http://localhost:8000/notes/search?q=${search}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setSearchMode(true);
        setData(res.data.notes);

    } catch (err) {
        console.log(err);
    }
}
    async function addNote(e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            let res = await axios.post("http://localhost:8000/notes",
                {
                    title,
                    content
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setMessage(res.data.message);
            getNotes();
        } catch (err) {
            navigate("/login");
        }
    }

    async function deleteNote(id) {
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:8000/notes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            getNotes();
        } catch (err) {
            navigate("/login");
        }
    }

    async function updateNote(id, newTitle, newContent) {
        const token = localStorage.getItem("token");

        await axios.put(
            `http://localhost:8000/notes/${id}`,
            { title: newTitle, content: newContent },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        getNotes();
    }

    return (
        <div className="notes-container">

            <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 38, height: 38,
                        background: "linear-gradient(135deg,#3b5bdb,#4c6ef5)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 3px 12px rgba(59,91,219,0.4)"
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontWeight:400, fontSize:"1.55rem", color:"#fff", lineHeight:1 }}>NoteVault</h1>
                        <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{data.length} note{data.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                <button
                    className="btn-secondary"
                    onClick={() => navigate("/profile")}
                    style={{
                        display:"flex", alignItems:"center", gap:8,
                        background:"rgba(255,255,255,0.1)",
                        border:"1px solid rgba(255,255,255,0.18)",
                        color:"#fff", padding:"10px 16px", borderRadius:10
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                </button>
            </div>

            <div className="notes-top">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <input placeholder="Note title…" onChange={(e) => setTitle(e.target.value)} />
                <input placeholder="What's on your mind?" onChange={(e) => setContent(e.target.value)} />

                <button onClick={addNote} style={{ whiteSpace:"nowrap", padding:"13px 22px" }}>
                    Add note
                </button>
            </div>
    
            <h4>{msg}</h4>
            <div
    style={{
        display: "flex",
        gap: "10px",
        marginTop: "20px",
        marginBottom: "20px"
    }}
>
    <input
        type="text"
        placeholder="🔍 Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px"
        }}
    />

    <button onClick={searchNotes}>
        Search
    </button>

    <button
        onClick={() => {
            setSearch("");
            setSearchMode(false);
            getNotes();
        }}
    >
        Clear
    </button>
</div>

            <div className="notes-grid">
                {data.map(note => (
                    <div key={note._id} className="note-card">

                        <h3>{note.title}</h3>
                        <p>{note.content}</p>

                        <div className="note-actions">
                            <button onClick={() => {
                                const newTitle = prompt("Enter new title", note.title);
                                const newContent = prompt("Enter new content", note.content);

                                if (!newTitle || !newContent) return;

                                updateNote(note._id, newTitle, newContent);
                            }}>
                                <span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    Edit
                                </span>
                            </button>

                            <button onClick={() => deleteNote(note._id)}>
                                <span style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                        <path d="M10 11v6"/><path d="M14 11v6"/>
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
                                    Delete
                                </span>
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div style={{ textAlign:"center", marginTop:80 }}>
                    <div style={{ fontSize:48, marginBottom:16, opacity:0.35 }}>📝</div>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:16 }}>No notes yet — add one above!</p>
                </div>
            )}

        </div>
    )
}

export default Notes
