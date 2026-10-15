//Get the HTML elements using their IDs
const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearButton = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

//Define the character limit
const MAX_CHARACTERS = 200;

//Function to update character and word counters
function updateCounters(){
    //Get the text currently inside the textarea
    const text = noteText.value
    //Count characters, including spaces
    const characters = text.length;
    //count words, ignoring extra spaces and empty input
    const words = text.trim() === ""
    ? 0
    : text.trim().split(/\s+/).length;

    //Display the counts
    charCount.textContent = `${characters}/${MAX_CHARACTERS} characters`;
    wordCount.textContent = `${words} words`;

    //Remove previous counter styles
    charCount.classList.remove("warning","over");

    //Apply the appropriate style
    if(characters > MAX_CHARACTERS){
        charCount.classList.add("over");
    }
    else if(characters > 180){
        charCount.classList.add("warning");
    }
}

//Save the draft whenever the user types
noteText.addEventListener("input", function (){
    updateCounters();

    //store the current note in localStorage
    localStorage.setItem("note-draft", noteText.value);
});

//Restore the saved draft when the page loads
const savedDraft = localStorage.getItem("note-draft");

if(savedDraft !== null){
    noteText.value = savedDraft;
}

//update counters after restoring the draft
updateCounters();

//Function to clear the note and its saved draft
function clearNote(){
    //Empty testarea
    noteText.value = "";

    //Reset the counters and remove warning styles
    updateCounters();

    //Delete the saved draft
    localStorage.removeItem("note-draft");
}

//clear button functionality
clearButton.addEventListener("click",clearNote);

//clear the note when escape is pressed inside the textarea
noteText.addEventListener("keydown", function (event){
    if(event.key === "Escape"){
        clearNote();
    }
});

//Function to update the theme buttom button
function updateThemeLabel(){
    if(document.body.classList.contains("dark")){
        themeToggle.textContent = "Light mode";
    }
    else{
        themeToggle.textContent = "Dark mode";
    }
}

//Restore the previously selected theme
const savedTheme = localStorage.getItem("note-theme");

if(savedTheme === "dark"){
    document.body.classList.add("dark");
}

//set the correct button label on page load
updateThemeLabel();

//Toggle the theme when the button is clicked
themeToggle.addEventListener("click",function(){
    document.body.classList.toggle("dark");

    //Determine the currently selected theme
    const currentTheme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

        //Remember the theme choice
        localStorage.setItem("note-theme", currentTheme);

        //update the button label
        updateThemeLabel();
    
})
