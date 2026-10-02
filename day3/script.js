//Array of objects
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

//Helper Function: normalizeText()
function normalizeText(text){
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

//searchNotes(word)
function searchNotes(word) {
    return notes.filter((note) => {
        return note.text
              .toLowerCase()
              .includes(word.toLowerCase());
    });
}

//LongestNote()
function longestNote() {

    // If the notes array is empty, return null
    if (notes.length === 0) {
        return null;
    }

    // Assume the first note is the longest initially
    let longest = notes[0];

    // Loop through every note
    for (let note of notes) {

        // Compare the number of characters
        // in the current note with the longest note
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    // Return the longest note object
    return longest;
}

//countByCategory()
function countByCategory() {

    // reduce() is used to build an object
    // containing the category counts.
    return notes.reduce((counts, note) => {

        // Increase the count for the current category
        counts[note.category]++;

        // Return the updated object
        return counts;

    }, {
        personal: 0,
        work: 0,
        study: 0
    });
}

//getSummary()
function getSummary() {

    // Get the category counts
    let counts = countByCategory();

    // Return a formatted sentence using
    // a template literal
    return `${notes.length} notes: ${counts.personal} personal, ${counts.work} work, ${counts.study} study.`;
}

//isDuplicate(text)
function isDuplicate(text) {

    // Normalize the text we are searching for
    let normalizedText = normalizeText(text);

    // some() returns true if at least one note
    // matches the condition
    return notes.some((note) => {

        // Normalize the existing note's text
        // before comparing
        return normalizeText(note.text) === normalizedText;
    });
}

//addNote(text, category)
function addNote(text, category) {

    // Remove unnecessary spaces from the beginning
    // and end of the note
    let cleanText = text.trim();

    // Check 1: Validate the note length

    if (cleanText.length < 1 || cleanText.length > 200) {

        console.log(
            "Note was not added: text must be between 1 and 200 characters."
        );

        return false;
    }

    // Check 2: Check for duplicate notes
    if (isDuplicate(cleanText)) {

        console.log(
            "Note was not added: a note with the same text already exists."
        );

        return false;
    }

    // Check 3: Validate the category
    // These are the only categories allowed
    let validCategories = [
        "personal",
        "work",
        "study"
    ];

    // includes() checks whether the supplied
    // category exists in the validCategories array
    if (!validCategories.includes(category)) {

        console.log(
            "Note was not added: category must be personal, work, or study."
        );

        return false;
    }

    let newId = notes.length + 1;

    // Add the new note to the array
    notes.push({
        id: newId,
        text: cleanText,
        category: category
    });

    console.log("Note added successfully.");
    return true;
}

//Testing the functions

//searchNotes
console.log("=== SEARCH NOTES ===");
console.log(searchNotes("javascript")); //[ { id: 4, text: 'Revise JavaScript arrays', category: 'study' } ]
console.log(searchNotes("Maize"));// []

//longestNote
console.log("=== LONGEST NOTE ===");
console.log(longestNote()); //{ id: 3, text: 'Email the project report to Grace', category: 'work' }

//countByCategory
console.log("=== CATEGORY COUNTS ===");
console.log(countByCategory()); //{ personal: 2, work: 1, study: 2 }

//getSummary
console.log("=== SUMMARY ===");
console.log(getSummary()); //5 notes: 2 personal, 1 work, 2 study.

//isDuplicate
console.log("=== DUPLICATE CHECK ===");
console.log(isDuplicate("Call mum")); //true
console.log(isDuplicate("CALL MUM")); //true
console.log(isDuplicate("  Call    mum  ")); //true
console.log(isDuplicate("Go shopping")); //false

//addNote
console.log("=== ADD NOTE ===");
console.log(addNote("Learn JavaScript arrays", "study")); //Note added successfully  true
console.log(addNote("Call mum", "personal")); //Note was not added: a note with the same text already exists.  false
console.log(addNote("Go to the gym", "health")); //Note was not added: category must be personal, work, or study.   false
console.log(addNote("   ", "personal")); //Note was not added: text must be between 1 and 200 characters.   false

//display all notes
console.log("=== ALL NOTES ===");
console.log(notes); 
