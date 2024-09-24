
function App() {

    function auth() {
        fetch('http://localhost:8001/api/user-service/auth',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function login() {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;

        fetch('http://localhost:8001/api/user-service/users/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email: email, password: password })
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function logout() {
        fetch('http://localhost:8001/api/user-service/users/logout',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }


    function register() {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const displayName = document.getElementById('displayNameInput').value;

        fetch('http://localhost:8001/api/user-service/users/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email: email, password: password, displayName: displayName })
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function deleteUser() {

        fetch('http://localhost:8001/api/user-service/users/deleteUser',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function changePassword() {
        const password = document.getElementById('passwordInput').value;
        const newPassword = document.getElementById('newPasswordInput').value;

        fetch('http://localhost:8001/api/user-service/users/changePassword',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password, newPassword: newPassword }),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function changeDisplayName() {
        const newDisplayName = document.getElementById('displayNameInput').value;

        fetch('http://localhost:8001/api/user-service/users/changeDisplayName',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newDisplayName: newDisplayName }),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    function match() {

        fetch('http://localhost:4001',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error(error))
    }

    return (
        <>
            <input id="emailInput" placeholder="email" />
            <input id="displayNameInput" placeholder="displayName" />
            <input id="passwordInput" placeholder="password" />
            <input id="newPasswordInput" placeholder="new password" />
            <button id="loginButton" onClick={() => login()}>Login</button>
            <button id="registerButton" onClick={() => register()}>Register</button>
            <button id="deleteButton" onClick={() => deleteUser()}>deleteUser</button>
            <button id="authButton" onClick={() => auth()}>auth</button>
            <button id="logoutButton" onClick={() => logout()}>logout</button>
            <button id="changePwdButton" onClick={() => changePassword()}>change pwd</button>
            <button id="changeDisplayNameButton" onClick={() => changeDisplayName()}>change displayName</button>

            <button id="matchButton" onClick={() => match()}>connect matching service</button>
        </>
    );
}

export default App;
