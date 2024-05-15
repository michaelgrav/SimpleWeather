import { updatePage } from './index.js';

const apiKey = 'b833cc616e6d0707092222910033fba7';

export async function searchLocation(searchEntry) {
    try {
        // Split the searchEntry into city and state
        const [city, state] = searchEntry.split(',').map(entry => entry.trim());
        console.log("searchEntry: " + searchEntry)
        console.log("city: " + city);
        console.log("state: " + state);
        
        // Check if city or state is empty
        if (!city && !state) {
            showAlert("Please enter both city and state.");
            return;
        }
        
        // Check if state is a valid abbreviation
        else if (!state) {
            showAlert("Please enter a state in the dropdown.");
            return;
        }

        // Check if state is a valid abbreviation
        else if (!city) {
            showAlert("Please enter a city in the search field.");
            return;
        }

        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchEntry}&limit=1&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            showAlert("No data found for the entered city and state.");
        } else {
            sessionStorage.setItem("searchLat", data[0].lat);
            sessionStorage.setItem("searchLon", data[0].lon);
            // Call updatePage with the new latitude and longitude
            updatePage({coords: {latitude: data[0].lat, longitude: data[0].lon}});
        }
        
        return data;
    } catch (error) {
        console.error(error);
        showAlert("An error occurred while processing your request. Please try again later.");
    }
}

function showAlert(message) {
    const modal = `
        <div class="modal fade" id="alertModal" tabindex="-1" aria-labelledby="alertModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="alertModalLabel">Error Processing Search Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if exists
    const existingModal = document.getElementById('alertModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Append new modal to the body
    document.body.insertAdjacentHTML('beforeend', modal);

    // Show the modal
    const modalInstance = new bootstrap.Modal(document.getElementById('alertModal'));
    modalInstance.show();
}

