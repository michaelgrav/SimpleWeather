const apiKey = 'b833cc616e6d0707092222910033fba7';

export async function searchLocation(searchEntry) {
    try {
        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchEntry}&limit=1&appid=${apiKey}`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            window.alert("Search text was formatted invalid. Please enter City, State (Full state name)");
        } else {
            sessionStorage.setItem("searchLat", data[0].lat);
            sessionStorage.setItem("searchLon", data[0].lon);
            location.reload();
        }
        
        return data;
    } catch (error) {
        console.error(error);
    }
}
