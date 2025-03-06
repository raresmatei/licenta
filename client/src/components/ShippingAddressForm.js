// src/components/ShippingAddressForm.js
import React, { useState, useEffect } from 'react';
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const ShippingAddressForm = ({ shippingAddress, setShippingAddress }) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all');
        const countryNames = response.data.map(country => country.name.common).sort();
        setCountries(countryNames);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // If shippingAddress.country is already set, fetch states
  useEffect(() => {
    const fetchStates = async () => {
      if (!shippingAddress.country) return; // no country selected, skip
      try {
        const response = await axios.post('https://countriesnow.space/api/v0.1/countries/states', {
          country: shippingAddress.country
        });
        const statesList = response.data.data.states.map(s => s.name).sort();
        setStates(statesList);
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    fetchStates();
  }, [shippingAddress.country]);

  // If shippingAddress.state is already set, fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      if (!shippingAddress.country || !shippingAddress.state) return; // no state selected, skip
      try {
        const response = await axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', {
          country: shippingAddress.country,
          state: shippingAddress.state
        });
        const citiesList = response.data.data.sort();
        setCities(citiesList);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, [shippingAddress.country, shippingAddress.state]);

  // Handler for text fields (fullName, addressLine1, etc.)
  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  // Handler for selecting country
  const handleCountryChange = async (e) => {
    const selectedCountry = e.target.value;
    setShippingAddress({ ...shippingAddress, country: selectedCountry, state: '', city: '' });
    setStates([]);
    setCities([]);
  };

  // Handler for selecting state
  const handleStateChange = async (e) => {
    const selectedState = e.target.value;
    setShippingAddress({ ...shippingAddress, state: selectedState, city: '' });
    setCities([]);
  };

  // Handler for selecting city
  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setShippingAddress({ ...shippingAddress, city: selectedCity });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Full Name"
        name="fullName"
        value={shippingAddress.fullName || ''}
        onChange={handleShippingChange}
        fullWidth
      />
      <TextField
        label="Street"
        name="addressLine1"
        value={shippingAddress.addressLine1 || ''}
        onChange={handleShippingChange}
        fullWidth
      />
      <TextField
        label="Numar"
        name="addressLine2"
        value={shippingAddress.addressLine2 || ''}
        onChange={handleShippingChange}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Country</InputLabel>
        <Select
          value={shippingAddress.country || ''}
          label="Country"
          onChange={handleCountryChange}
        >
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth disabled={!shippingAddress.country || states.length === 0}>
        <InputLabel>State</InputLabel>
        <Select
          value={shippingAddress.state || ''}
          label="State"
          onChange={handleStateChange}
        >
          {states.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth disabled={!shippingAddress.state || cities.length === 0}>
        <InputLabel>City</InputLabel>
        <Select
          value={shippingAddress.city || ''}
          label="City"
          onChange={handleCityChange}
        >
          {cities.map((city) => (
            <MenuItem key={city} value={city}>
              {city}
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
      />
    </Box>
  );
};

export default ShippingAddressForm;
