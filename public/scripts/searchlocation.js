const key = '061cec208840636a12589da186d087bd';

export function searchLocation(searchEntry) {
    try {
        fetch('https://api.openweathermap.org/geo/1.0/direct?q=' + searchEntry + '&limit=' + "1" + '&appid=' + key)
        .then(function(resp) { return resp.json()  }) // Convert response to json
        .then(function(data) {
            sessionStorage.setItem("searchLat", data[0].lat);
            sessionStorage.setItem("searchLon", data[0].lon);
        })  
    } catch(error) {
        console.error(error)
    }

    //location.reload(); 
}
