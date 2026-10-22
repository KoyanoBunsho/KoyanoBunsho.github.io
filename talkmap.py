

# # Leaflet cluster map of talk locations
#
# (c) 2016-2017 R. Stuart Geiger, released under the MIT license
#
# Run this script to read the .md files in _talks/.
# This scrapes the location YAML field from each .md file, geolocates it with
# geopy/Nominatim, and updates only the location data for the cluster map.
# Keep the reviewed HTML and libraries intact when regenerating locations.
#
# Requires: geopy

import json
from pathlib import Path
from geopy import Nominatim
from geopy.extra.rate_limiter import RateLimiter

root = Path(__file__).resolve().parent
g = sorted((root / "_talks").glob("*.md"))


geocoder = Nominatim(user_agent="KoyanoBunsho.github.io-talkmap")
geocode = RateLimiter(geocoder.geocode, min_delay_seconds=1)
location_dict = {}
location = ""
permalink = ""
title = ""


for file in g:
    with open(file, 'r', encoding='utf-8') as f:
        lines = f.read()
        if lines.find('location: "') > 1:
            loc_start = lines.find('location: "') + 11
            lines_trim = lines[loc_start:]
            loc_end = lines_trim.find('"')
            location = lines_trim[:loc_end]
                            
           
        else:
            continue
        if location in location_dict:
            continue
        location_dict[location] = geocode(location)
        print(location, "\n", location_dict[location])


points = [[label, result.latitude, result.longitude]
          for label, result in location_dict.items() if result is not None]
(root / "talkmap" / "org-locations.js").write_text(
    "var addressPoints = " + json.dumps(points, ensure_ascii=True, indent=2) + ";\n",
    encoding="utf-8",
)




