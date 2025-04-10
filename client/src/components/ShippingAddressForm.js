// src/components/ShippingAddressForm.js
import React, { useState, useEffect } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Country, State, City } from 'country-state-city';

const ShippingAddressForm = ({ shippingAddress, setShippingAddress }) => {
  const [countries, setCountries] = useState([]); // array of country objects
  const [states, setStates] = useState([]);         // array of state objects
  const [cities, setCities] = useState([]);         // array of city objects

  // Load all countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    // Optionally sort alphabetically by name:
    const sortedCountries = allCountries.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setCountries(sortedCountries);
  }, []);

  // When shippingAddress.country changes, load the states for that country.
  useEffect(() => {
    if (!shippingAddress.country) {
      setStates([]);
      return;
    }
    const stateList = State.getStatesOfCountry(shippingAddress.country); // returns array of state objects
    // Optionally sort the states by name:
    setStates(stateList.sort((a, b) => a.name.localeCompare(b.name)));
  }, [shippingAddress.country]);

  // When shippingAddress.state changes, load the cities for that state.
  useEffect(() => {
    if (!shippingAddress.country || !shippingAddress.state) {
      setCities([]);
      return;
    }
    const citiesList = City.getCitiesOfState(shippingAddress.country, shippingAddress.state); // array of city objects
    // Optionally sort the cities by name:
    setCities(citiesList.sort((a, b) => a.name.localeCompare(b.name)));
  }, [shippingAddress.country, shippingAddress.state]);

  // Handler for simple text fields
  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  // When selecting a country, set it (using its ISO code) and reset state/city
  const handleCountryChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      country: e.target.value,  // e.g., "US" or "RO"
      state: '',
      city: ''
    });
  };

  // When selecting a state, set it (using its ISO code) and reset city
  const handleStateChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      state: e.target.value, // e.g., "CA"
      city: ''
    });
  };

  // When selecting a city, save its name (or id if available)
  const handleCityChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      city: e.target.value
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Full Name"
        name="fullName"
        value={shippingAddress.fullName || ''}
        onChange={handleShippingChange}
        fullWidth
        required
      />
      <TextField
        label="Street"
        name="addressLine1"
        value={shippingAddress.addressLine1 || ''}
        onChange={handleShippingChange}
        fullWidth
        required
      />
      <FormControl fullWidth required>
        <InputLabel>Country</InputLabel>
        <Select
          value={shippingAddress.country || ''}
          label="Country"
          onChange={handleCountryChange}
        >
          {countries.map((country) => (
            <MenuItem key={country.isoCode} value={country.isoCode}>
              {country.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        fullWidth
        required
        disabled={!shippingAddress.country || states.length === 0}
      >
        <InputLabel>State</InputLabel>
        <Select
          value={shippingAddress.state || ''}
          label="State"
          onChange={handleStateChange}
        >
          {states.map((state) => (
            <MenuItem key={state.isoCode} value={state.isoCode}>
              {state.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        fullWidth
        required
        disabled={!shippingAddress.state || cities.length === 0}
      >
        <InputLabel>City</InputLabel>
        <Select
          value={shippingAddress.city || ''}
          label="City"
          onChange={handleCityChange}
        >
          {cities.map((city, index) => (
            <MenuItem key={index} value={city.name}>
              {city.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="ZIP"
        name="zip"
        value={shippingAddress.zip || ''}
        onChange={handleShippingChange}
        fullWidth
        required
      />
    </Box>
  );
};

export default ShippingAddressForm;
