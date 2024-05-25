let emojiMap = new Map([
    [8, String.fromCodePoint(0x2601)],
    [5, String.fromCodePoint(0x1F327)],
    [3, String.fromCodePoint(0x1F327)],
    [800, String.fromCodePoint(0x2600)],
    [7, String.fromCodePoint(0x1F32B)],
    [6, String.fromCodePoint(0x1F328)],
    [2, String.fromCodePoint(0x26C8)]
]);

// Variables
const key = 'b833cc616e6d0707092222910033fba7';
var city = ''

// Update the function calls in askBrowserForLocation and updatePage 
function askBrowserForLocation() { 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePage);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}


/*
    Main function that calls the other functions
    update navbar > get current weather > get future weather
*/
export function updatePage(position: GeolocationPosition) {
    getWeatherAndInsertCurrentWeather(position.coords.latitude, position.coords.longitude);
}

function getWeather(lat: number, lon: number) {
    var excludedAPIFields = "minutely";

    try {
        fetch('https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + lon + '&exclude=' + excludedAPIFields + '&appid=' + key)
        .then(function(resp) { return resp.json()  }) // Convert response to json
        .then(function(data) {
            if('alerts' in data) insertWeatherAlerts(data.alerts);
            else {
                // Clear alerts on search
                const warningContainer = document.getElementById('weatherAlertsContainer');
                if (warningContainer) warningContainer.innerHTML = '';
            }

            const sunsetTime = new Date(data.current.sunset * 1000);
            insertCurrentWeather(data.current)
            insertFutureWeather(data.hourly, data.daily, sunsetTime);
            renderRainPercentageChart(data.hourly);
        })
    } catch(error) {
        console.error(error)
    }
}


// ------------------------------------------------------ CURRENT WEATHER
interface CurrentWeather {
    id: number;
    main: string;
    description: string;
    icon: string;
}

interface CurrentWeatherData {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: CurrentWeather[];
}


function insertCurrentWeather(data: CurrentWeatherData): undefined {
    const container = document.getElementById('currentWeatherContainer');
    if (!container) {
        console.error('Current weather container not found');
        return;
    }

    container.innerHTML = '';

    var current_fahrenheit = Math.round(((data.temp - 273.15) * 1.8) + 32);
    var feels_like_fahrenheit = Math.round(((data.feels_like - 273.15) * 1.8) + 32);

    var windSpeedMeterPerSec = data.wind_speed;
    var windGustMeterPerSec = data.wind_gust;

    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)
    var windGustMilePerHour = Math.round(windGustMeterPerSec * 2.237)

    var cloudCoverage = data.clouds;

    var mainWeatherConditions = data.weather[0].main;
    var detailedWeatherConditions = data.weather[0].description

    if (mainWeatherConditions == "Clear") 
        mainWeatherConditions = "☂️ Current Conditions: " + "Clear skies ahead!";
    else if (mainWeatherConditions.toLowerCase() === detailedWeatherConditions.toLowerCase()) 
        mainWeatherConditions = "☂️ Current Conditions: " + mainWeatherConditions
    else 
        mainWeatherConditions = "☂️ Current Conditions: " + mainWeatherConditions + " (more specifically, " + detailedWeatherConditions + ")"

    var sunSetTime = formatAMPM(new Date(data.sunset * 1000));

    if (data.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(data.weather[0].id);
    }

    if(!Number.isNaN(windGustMilePerHour)) {
        var content = `
        <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
            <h1>It's currently ${current_fahrenheit}&deg; in ${city} ${emojiMap.get(emojiID)}</h1>
            <br/>
            <p>${mainWeatherConditions}</p>
            <p>🌡️ It feels like ${feels_like_fahrenheit}&deg;</p>
            <p>🍃 Current wind speed is ${windSpeedMilePerHour}mph with gusts up to ${windGustMilePerHour}mph</p>
            <p>☁️ Cloud coverage is currently ${cloudCoverage}%</p>
        </div>
      `;
    } 
    else {
        var content = `
            <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
                <h1>It's currently ${current_fahrenheit}&deg; in ${city} ${emojiMap.get(emojiID)}</h1>
                <br/>
                <p>${mainWeatherConditions}</p>
                <p>🌡️ It feels like ${feels_like_fahrenheit}&deg;</p>
                <p>🍃 Current wind speed is ${windSpeedMilePerHour}mph</p>
                <p>☁️ Cloud coverage is currently ${cloudCoverage}%</p>
            </div>
        `;
    }
    
    
    container.innerHTML += content;
}

interface HourlyWeather {
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
    }[];
    pop: number;
    rain?: {
        '1h': number;
    };
}

type HourlyWeatherArray = HourlyWeather[];

declare namespace Chart {
    function getChart(ctx: CanvasRenderingContext2D | HTMLCanvasElement): Chart;

    export interface ChartConfiguration {
        type: string;
        data: ChartData | boolean;
        options: ChartOptions;
    }

    export interface ChartData {
        labels: string[];
        datasets: ChartDataset[];
    }

    export interface ChartDataset {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
    }

    export interface ChartOptions {
        responsive: boolean;
        maintainAspectRatio: boolean;
        scales: {
            y: {
                beginAtZero: boolean;
                max: number;
                ticks: {
                    stepSize: number;
                };
            };
        };
        plugins: {
            title: ChartTitleOptions;
            legend: ChartLegendOptions;
        };
    }

    export interface ChartTitleOptions {
        display: boolean;
        text: string;
        font: {
            size: number;
        };
    }

    export interface ChartLegendOptions {
        position: string;
    }
}

function renderRainPercentageChart(hourlyData: HourlyWeatherArray) {
    const canvas = document.getElementById('rainPercentageChart') as HTMLCanvasElement | null;
    
    if (!canvas) {
        console.error('Canvas element with ID "rainPercentageChart" not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error('Canvas context not available');
        return;
    }

    const chartData = createRainChartData(hourlyData);

    if (!chartData[1]) {
        canvas.style.display = 'none';
        return;
    }

    canvas.style.display = 'block';

    // Ensure Chart.js is available globally or imported properly
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not found. Make sure it is imported or available globally.');
        return;
    }

    // Destroy existing chart instance if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }

    // Type assertion to inform TypeScript that Chart can be constructed
    const ChartConstructor = Chart as unknown as { new (ctx: CanvasRenderingContext2D, config: Chart.ChartConfiguration): Chart };

    new ChartConstructor(ctx, {
        type: 'line',
        data: chartData[0],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true, // Start y-axis at zero
                    max: 100, // Set maximum value of y-axis to 100
                    ticks: {
                        stepSize: 20 // Set step size for y-axis ticks
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'There Is Rain Within The Next 12 Hours!',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}


function createRainChartData(hourlyData: HourlyWeatherArray) {
    const labels: string[] = [];
    const rainPercentage: number[] = [];
    var hasNonzeroRainChance = false;

    // Extract data for each hour within the next 24 hours
    const currentTime = new Date().getTime();
    const twelveHoursLater = currentTime + (12 * 60 * 60 * 1000);
    hourlyData.forEach(hour => {
        const time = new Date(hour.dt * 1000);
        if (time.getTime() < twelveHoursLater) {
            let hours = time.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM or PM
            hours = hours % 12 || 12; // Convert to 12-hour format
            const minutes = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
            labels.push(`${hours}:${minutes} ${ampm}`); // Use hour as label
            rainPercentage.push(hour.pop * 100); // Use rain percentage as data point

            if (hour.pop > 0) hasNonzeroRainChance = true;
        }
    });


    // Return an array with the current return value and hasNonzeroRainChance boolean
    return [
        {
            labels: labels,
            datasets: [{
                label: 'Rain Percentage',
                data: rainPercentage,
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // Blue color
                borderColor: 'rgba(54, 162, 235, 1)', // Blue color
                borderWidth: 1
            }]
        },
        hasNonzeroRainChance // Boolean value indicating if there is a non-zero rain chance
    ];
}


// ------------------------------------------------------ FUTURE WEATHER DATA
interface Weather {
    id: number;
    main: string;
    description: string;
    icon: string;
}

interface Temperature {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
}

interface FeelsLike {
    day: number;
    night: number;
    eve: number;
    morn: number;
}

interface DailyWeatherData {
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: Temperature;
    feels_like: FeelsLike;
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust: number;
    weather: Weather[];
    clouds: number;
    pop: number;
    uvi: number;
}

function createFutureWeatherContainers(data: DailyWeatherData[]) {
    const mainContainer = document.getElementById('futureWeatherContainer');
    
    if (!mainContainer) {
        console.error('Document element with ID "futureWeatherContainer" not found');
        return;
    }
    else mainContainer.innerHTML = '';

    data.forEach(forecast => {
        var date = new Date(forecast.dt * 1000);
        var dateString = date.toDateString();
        var tableBodyID = dateString + "-table-body";
        var dayCardID = dateString + "-day-summary-card";
        const content = `
            <div id="${dateString}">
                <div id="${dayCardID}"></div>
                <div class="table-responsive" id="${dateString+"-entire-table"}">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Time</th>
                                <th scope="col">Conditions</th>
                                <th scope="col">Temp</th>
                                <th scope="col">Feels Like</th>
                                <th scope="col">Rain Chance</th>
                                <th scope="col">Cloud Coverage</th>
                            </tr>
                        </thead>
                        <tbody id="${tableBodyID}"></tbody>
                    </table>
                </div>
            </div>
          `;
    
        mainContainer.innerHTML += content;
    });
}

function insertFutureWeather(data: HourlyWeatherArray, dataDaily: DailyWeatherData[], sunsetTime: Date) {
    createFutureWeatherContainers(dataDaily);

    let sunsetRowInserted = false;

    var dayEnteries = new Set();

    data.shift();

    data.forEach(forecast => {
        // Actual current temp
        var fahrenheit = Math.round(((forecast.temp - 273.15) * 1.8) + 32);
        var fahrenheitFeelLike = Math.round(((forecast.feels_like - 273.15) * 1.8) + 32);

        var date = new Date(forecast.dt * 1000);
        var dateString = date.toDateString();
        var time = formatAMPM(date);

        var currDate = new Date();
        var currDateString = currDate.toDateString();
        let dateText = "";

        const tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));

        const container = document.getElementById(dateString + "-day-summary-card");

        // Date is today
        if(currDateString == dateString) {
            dayEnteries.add(dateString);
            dateText = "Today"

            // Check if the current time is after sunset
            if (date > sunsetTime && !sunsetRowInserted) {
                const sunsetRow = `
                    <tr class="golden">
                        <td>${formatAMPM(sunsetTime)}</td>
                        <td>Sunset 🌇</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                `;

                const hourlyContainer = document.getElementById(dateString+"-table-body");
                if (!hourlyContainer) {
                    console.error('hourlyContainer container not found');
                    return;
                }
                hourlyContainer.innerHTML += sunsetRow;
                sunsetRowInserted = true;
            }
        }

        // Date is tomorrow
        else if (tomorrow.toDateString() == dateString) {
            dayEnteries.add(dateString);
            dateText = "Tomorrow"

            if(!dayEnteries.has(dateText)) {
                dayEnteries.add(dateText);


                var daySummary = ``
                // Add the summary card for that day
                dataDaily.forEach(dayEntry => {
                    var dayDate = new Date(dayEntry.dt * 1000).toDateString();
                    if(dayDate == dateString) {
                        daySummary = futureWeatherCard(dayEntry, dayDate)
                    }
                });

                if (!container) {
                    console.error('day-summary-card container not found');
                    return;
                }
                container.innerHTML += daySummary;
            }
        }

        // Date is sometime past tomorrow
        else {
            dateText = dateString
            if(!dayEnteries.has(dateText)) {
                dayEnteries.add(dateText)

                var daySummary = ``
                // Add the summary card for that day
                dataDaily.forEach(dayEntry => {
                    var dayDate = new Date(dayEntry.dt * 1000).toDateString();
                    if(dayDate == dateString) {
                        daySummary = futureWeatherCard(dayEntry, dayDate)
                    }
                });

                if (!container) {
                    console.error('day-summary-card container not found');
                    return;
                }
                container.innerHTML += daySummary;
            }
        }

        var detailedForecastText = "";
        if (forecast.weather[0].description == "clear sky") detailedForecastText = "clear skies"
        else detailedForecastText = forecast.weather[0].description

        var rainChance = (forecast.pop * 100).toFixed(0);

        var emojiID = 800;
        if (forecast.weather[0].id !== 800) {
            emojiID = firstDigit(forecast.weather[0].id);
        }

        const hourlyContainer = document.getElementById(dateString+"-table-body");

        const content = `
            <tr>
                <td>${time}</td>
                <td>${detailedForecastText}</td>
                <td>${fahrenheit}&deg;</td>
                <td>${fahrenheitFeelLike}&deg;</td>
                <td>${rainChance}%</td>
                <td>${forecast.clouds}%</td>
            </tr>
          `;
    
        if (!hourlyContainer) {
            console.error('hourlyContainer container not found');
            return;
        }
        hourlyContainer.innerHTML += content;
    });

    // Insert the rest of the future days
    dataDaily.forEach(dayEntry => {
        var dayDate = new Date(dayEntry.dt * 1000).toDateString();
        if(!dayEnteries.has(dayDate)) {
            const container = document.getElementById(dayDate + "-day-summary-card");
            var daySummary = futureWeatherCard(dayEntry, dayDate)
            if (!container) {
                console.error('day-summary-card container not found');
                return;
            }
            container.innerHTML += daySummary;

            // Clean up the days that shouldn't have tables (no hourly results)
            const element = document.getElementById(dayDate+"-entire-table");
            if (!element) {
                console.error('entire-table container not found');
                return;
            }
            element.remove();
        }
    });
}

function futureWeatherCard(data: DailyWeatherData, date: string) {
    // Convert kelvin to fahrenheit
    var max_fahrenheit = Math.round(((data.temp.max - 273.15) * 1.8) + 32);
    var min_fahrenheit = Math.round(((data.temp.min - 273.15) * 1.8) + 32);

    var windSpeedMeterPerSec = data.wind_speed;
    var windGustMeterPerSec = data.wind_gust;

    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)
    var windGustMilePerHour = Math.round(windGustMeterPerSec * 2.237)

    var cloudCoverage = data.clouds;

    var sunRiseTime = formatAMPM(new Date(data.sunrise * 1000));
    var sunSetTime = formatAMPM(new Date(data.sunset * 1000));

    if (data.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(data.weather[0].id);
    }

    return `
    <hr/>
    <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
        <h1>${date}: ${data.summary}</h1>
        <br/>
        <p>🌡️ High will be ${max_fahrenheit}&deg;, low will be ${min_fahrenheit}&deg;</p>
        <p>☂️ Chance of rain for the day is ${(data.pop * 100).toFixed(0)}%</p>
        <p>🍃 Wind conditions will be ${windSpeedMilePerHour}mph with gusts up to ${windGustMilePerHour}mph</p>
        <p>☁️ Cloud coverage will be ${cloudCoverage}%</p>
        <p>🌅 The sun will rise at at ${sunRiseTime} and set at ${sunSetTime}</p>
    </div>
    `;
}


// ------------------------------------------------------ WEATHER ALERTS
interface WeatherAlert {
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
}

type WeatherAlertArray = WeatherAlert[];

function insertWeatherAlerts(alertsData: WeatherAlertArray) {
    const warningContainer = document.getElementById('weatherAlertsContainer');

    if (warningContainer) {
        warningContainer.innerHTML = '';
        const alertDropdown = `
        <p class="d-inline-flex gap-1">
            <button class="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collaspedAlertContainer" aria-expanded="false" aria-controls="collaspedAlertContainer">
                View ${alertsData.length} weather alerts
            </button>
        </p>

        <div class="collapse" id="collaspedAlertContainer"></div>
        `

        warningContainer.innerHTML += alertDropdown;

        const collaspedAlertContainer = document.getElementById('collaspedAlertContainer')
        if (collaspedAlertContainer) {
            // Insert each alert
            alertsData.forEach(alert => {
                var startDate = new Date(alert.start * 1000);
                var startDateString = startDate.toDateString();
                var startTime = formatAMPM(startDate);

                var endDate = new Date(alert.end * 1000);
                var endDateString = endDate.toDateString();
                var endTime = formatAMPM(endDate);

                const content = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">${alert.event}</h4>
                    <p class="mb-0">${startDateString} at ${startTime} to ${endDateString} at ${endTime}</p>

                    <p class="pt-3 pb-1">${alert.description}</p>

                    <p class="mb-0">Issuer: ${alert.sender_name}</p>
                </div>
                `;

                collaspedAlertContainer.innerHTML += content;
            });
        }
    }
}


// ------------------------------------------------------ HELPER METHODS

function formatAMPM(date: Date): string {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const strMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const strTime = hours + ':' + strMinutes + ' ' + ampm;
    return strTime;
}


function firstDigit(num: number): number {
    const matches = String(num).match(/\d/);
    
    if (matches) {
        const digit = Number(matches[0]);
        
        return (num < 0) ? -digit : digit;
    }
    
    return 0;
}

interface States {
    [key: string]: string;
}

const states: States = {
    "arizona": "AZ",
    "alabama": "AL",
    "alaska": "AK",
    "arkansas": "AR",
    "california": "CA",
    "colorado": "CO",
    "connecticut": "CT",
    "district of columbia": "DC",
    "delaware": "DE",
    "florida": "FL",
    "georgia": "GA",
    "hawaii": "HI",
    "idaho": "ID",
    "illinois": "IL",
    "indiana": "IN",
    "iowa": "IA",
    "kansas": "KS",
    "kentucky": "KY",
    "louisiana": "LA",
    "maine": "ME",
    "maryland": "MD",
    "massachusetts": "MA",
    "michigan": "MI",
    "minnesota": "MN",
    "mississippi": "MS",
    "missouri": "MO",
    "montana": "MT",
    "nebraska": "NE",
    "nevada": "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    "ohio": "OH",
    "oklahoma": "OK",
    "oregon": "OR",
    "pennsylvania": "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    "tennessee": "TN",
    "texas": "TX",
    "utah": "UT",
    "vermont": "VT",
    "virginia": "VA",
    "washington": "WA",
    "west virginia": "WV",
    "wisconsin": "WI",
    "wyoming": "WY",
    "american samoa": "AS",
    "guam": "GU",
    "northern mariana islands": "MP",
    "puerto rico": "PR",
    "us virgin islands": "VI",
    "us minor outlying islands": "UM"
};

function stateNameToAbbreviation(name: string): string{
	let a = name.trim().replace(/[^\w ]/g, "").toLowerCase(); //Trim, remove all non-word characters with the exception of spaces, and convert to lowercase
	
    if (states[a] !== undefined) return states[a];
	else return "";
}


// ------------------------------------------------------ NAVBAR METHODS
export function updateNavbarText(lat: number, lon: number) {
    const container = document.getElementById('navbarForLocationDisplay');
    
    // Check if container is null
    if (!container) {
        console.error("Container element not found");
        return Promise.reject("Container element not found");
    }

    container.innerHTML = '';

    return new Promise<string>((resolve, reject) => {
        try {
            fetch('https://api.openweathermap.org/geo/1.0/reverse?lat=' + lat + '&lon=' + lon + '&appid=' + key)
            .then(resp => resp.json()) // Convert response to json
            .then(data => {
                city = data[0]?.name; // Use optional chaining to access 'name' property safely
                let state = data[0]?.state;

                if (state && state.length > 2) {
                    state = stateNameToAbbreviation(state);
                }

                const content = "Forecast for " + city + ", " + state;

                container.innerHTML += content;

                resolve(city); // Resolve the promise with the city name
            })  
            .catch(error => {
                console.error(error);
                reject(error); // Reject the promise if there's an error
            });
        } catch(error) {
            console.error(error);
            reject(error); // Reject the promise if there's an error
        }
    });
}

// Call updateNavbarText first to fetch the city name, then call insertCurrentWeather
function getWeatherAndInsertCurrentWeather(lat: number, lon: number) {
    updateNavbarText(lat, lon)
    .then(_ => {
        // Fetch weather data and insert current weather using the retrieved city name
        getWeather(lat, lon);
    })
    .catch(error => {
        console.error(error);
    });
}

window.onload = function() {
    askBrowserForLocation();
}