const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

//Store the users returned by the API
let users = [];
let hasLoadedUsers = false;

//Display a list of users on the page
function renderUsers(list){
    //Remove the previously displayed users
    usersList.replaceChild();

    //Display a message when no users match
    if(list.length === 0){
        status.textContent = "No users match your filter."
        return;
    }

    //create one list item for each user
    list.forEach((user) => {
        const li = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Compant: ${user.company.name}`;

        li.append(name, email, city, company);
        usersList.appendChild(li);
    });
    status.textContent = `Showing ${list.length} user(s)`
}

//load users from API
async function loadUsers(){
    loadButton.disabled = true;
    status.textContent = "Loading users...";
    usersList.replaceChildren();

    try {
        const response = await fetch(
             "https://jsonplaceholder.typicode.com/users"
        );

        //throw for HTTP errors
        if (!response.ok){
            throw new Error(`HTTP error: ${response.status} `);
        }

        const data = await response.json();

        //save the fetched data in an array
        users = data;
        hasLoadedUsers = true;

        //Apply the current filter without another request
        const searchText = filterInput.value.trim().toLowerCase();

        const filteredUsers = users.filter((user) =>
            user.name.toLowerCase().includes(searchText)
        );

        renderUsers(filteredUsers);
        
    } catch (error) {
        status.textContent =
            "Failed to load users. Please check your connection and try again.";

        console.error("Error loading users:", error);
        
    }finally {
        // Runs whether loading succeeds or fails.
        loadButton.disabled = false;

    }
}

// Load users when the button is clicked.
loadButton.addEventListener("click", loadUsers);

// Filter the already-loaded users as the user types.
filterInput.addEventListener("input", () => {
    if (!hasLoadedUsers) {
        status.textContent = "Click Load Users to get started.";
        return;
    }

    const searchText = filterInput.value.trim().toLowerCase();

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchText)
    );

    renderUsers(filteredUsers);
});