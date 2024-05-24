"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchLocation = void 0;
const index_1 = require("./index");
const bootstrap_1 = require("bootstrap");
const apiKey = 'b833cc616e6d0707092222910033fba7';
function searchLocation(searchEntry) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Split the searchEntry into city and state
            const [city, state] = searchEntry.split(',').map(entry => entry.trim());
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
            const response = yield fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchEntry}&limit=1&appid=${apiKey}`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const data = yield response.json();
            if (data.length === 0) {
                showAlert("No data found for the entered city and state.");
            }
            else {
                sessionStorage.setItem("searchLat", data[0].lat);
                sessionStorage.setItem("searchLon", data[0].lon);
                // Call updatePage with the new latitude and longitude
                (0, index_1.updatePage)({
                    coords: {
                        latitude: data[0].lat,
                        longitude: data[0].lon,
                        accuracy: 0,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    },
                    timestamp: Date.now()
                });
            }
            return data;
        }
        catch (error) {
            console.error(error);
            showAlert("An error occurred while processing your request. Please try again later.");
            return undefined;
        }
    });
}
exports.searchLocation = searchLocation;
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
    const modalElement = document.getElementById('alertModal');
    if (modalElement) {
        const modalInstance = new bootstrap_1.Modal(modalElement);
        modalInstance.show();
    }
    else {
        console.error("Failed to create modal instance. Element with id 'alertModal' not found.");
    }
}
