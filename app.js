const axios = require('axios');
const express = require('express');

const port = process.env.PORT || 3000;
const app = express();

const url = "https://backend-challenge-winter-2017.herokuapp.com/customers.json";
const page_query = "?page=";

function validate(validations, customer) {
  const id = customer.id;
  var invalid_fields = [];

  for(var i=0; i<validations.length; ++i){
    const key = Object.keys(validations[i]);
    const { required, type, length } = validations[i][key];

    if((required && customer[key] == undefined)
    || (type && type !== typeof(customer[key]))
    || (length && length.min && customer[key].length < length.min)
    || (length && length.max && customer[key].length < length.max)){
      invalid_fields.push(key);
    }
  }

  return { id, invalid_fields }
}

app.get('/', (req, res) => {
  axios.get(url).then((response) => {
    const page_data = response.data.pagination;
    var { current_page, per_page, total } = page_data;
    const last_page = Math.ceil(total / per_page);
    var invalid_customers = [];
    var promises = [];

    for(; current_page <= last_page; ++current_page) {
      promises.push(axios.get(url+page_query+current_page).then((page_response) => {
        const { validations, customers } = page_response.data;
        for(var i = 0; i<customers.length; ++i){
          const invalid_customer = validate(validations, customers[i]);
          if(invalid_customer.invalid_fields.length > 0){
            invalid_customers.push(invalid_customer);
          }
        }
      }));
    }

    axios.all(promises).then((results) => {
      res.status(200).send(invalid_customers);
    });

  }).catch((e) => {
    res.status(400).send(`${e}`);
  });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
