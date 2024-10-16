import { useState, useContext, useEffect } from 'react';
import { SocketContext } from './SocketContext';

function MatchingServicePage() {

    const [difficulties, setDifficulties] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedUser, setSelectedUser] = useState({ email: "test@email.com", displayName: "test" });

    const users = [
        { email: "test@email.com", displayName: "test" },
        { email: "user1@email.com", displayName: "user1" },
        { email: "user2@email.com", displayName: "user2" },
        { email: "user3@email.com", displayName: "user3" },
        { email: "user4@email.com", displayName: "user4" },
        { email: "user5@email.com", displayName: "user5" }
    ];

    const { getSocket } = useContext(SocketContext);
    let socket = getSocket();
    // console.log("socketID " + socket.id);

    useEffect(() => {

        function onConnect() {
            console.log(`${socket.id} Connected to server`);
        }

        function onDisconnect() {
            console.log(`${socket.id} Connected to server`);
        }

        function onFindingMatch() {
            console.log("Matching service finding match");
        }

        function onFoundMatch(data) {
            console.log("Matching service found match:");
            console.log(data);
        }

        function onNoMatch() {
            console.log("No match found after timeout");
        }

        function onDisconnectWhileMatch() {
            console.log("Disconnected while matching");
        }

        socket.on("connect", onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('finding-match', onFindingMatch);
        socket.on('found-match', onFoundMatch);
        socket.on('no-match', onNoMatch);
        socket.on('disconnect-while-match', onDisconnectWhileMatch);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('finding-match', onFindingMatch);
            socket.off('found-match', onFoundMatch);
            socket.off('no-match', onNoMatch);
            socket.off('disconnect-while-match', onDisconnectWhileMatch);
        };

    }, []);

    const handleDifficultyChange = (event) => {
        const value = event.target.value;
        setDifficulties(prevDifficulty =>
            prevDifficulty.includes(value)
                ? prevDifficulty.filter(d => d !== value)
                : [...prevDifficulty, value]
        );
    };

    const handleCategoryChange = (event) => {
        const value = event.target.value;
        setCategories(prevCategories =>
            prevCategories.includes(value)
                ? prevCategories.filter(t => t !== value)
                : [...prevCategories, value]
        );
    };

    const handleUserChange = (event) => {
        const selectedEmail = event.target.value;
        const user = users.find(user => user.email === selectedEmail);
        setSelectedUser(user);
    };

    const match = () => {
        console.log("create match");
        socket.emit('create-match', { difficulties: difficulties, categories: categories, email: selectedUser.email, displayName: selectedUser.displayName });
    }

    const cancelMatch = () => {
        console.log("cancel match");
        socket.emit('cancel-match');
    }

    return (
        <div>
            <h1>Matching page</h1>
            <div>
                <label>Select Difficulty:</label>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="EASY"
                            checked={difficulties.includes("EASY")}
                            onChange={handleDifficultyChange}
                        />
                        EASY
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="MEDIUM"
                            checked={difficulties.includes("MEDIUM")}
                            onChange={handleDifficultyChange}
                        />
                        MEDIUM
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="HARD"
                            checked={difficulties.includes("HARD")}
                            onChange={handleDifficultyChange}
                        />
                        HARD
                    </label>
                </div>
            </div>
            <br />
            <div>
                <label>Select Categories:</label>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="ALGORITHMS"
                            checked={categories.includes("ALGORITHMS")}
                            onChange={handleCategoryChange}
                        />
                        ALGORITHMS
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="ARRAYS"
                            checked={categories.includes("ARRAYS")}
                            onChange={handleCategoryChange}
                        />
                        ARRAYS
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            value="BIT MANIPULATION"
                            checked={categories.includes("BIT MANIPULATION")}
                            onChange={handleCategoryChange}
                        />
                        BIT MANIPULATION
                    </label>
                </div>
                <div>
                    <label htmlFor="user">Select User: </label>
                    <select id="user" value={selectedUser.email} onChange={handleUserChange}>
                        {users.map(user => (
                            <option key={user.email} value={user.email}>
                                {user.displayName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <br />
            <button onClick={match}>Match</button>
            <button onClick={cancelMatch}>Cancel Match</button>
        </div>
    );
}

export default MatchingServicePage;