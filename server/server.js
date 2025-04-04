const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(morgan('combined'));
app.use(cors());

const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER || 'your_db_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'your_db_name',
    password: process.env.DB_PASSWORD || 'your_db_password',
    port: process.env.DB_PORT || 5432
});

// API endpoint to fetch multi-line geometries from PostGIS.
app.get('/api/multilines', async (req, res) => {
  try {
    const srid = req.query.srid || 25831;
    const projectId = req.query.projectId || 'OSC-P002';

      const query = `
          SELECT line_layer_name,
--                  ST_AsGeoJSON(ST_Collect(geom)) AS geometry
              ST_AsGeoJSON(ST_Collect(ST_Transform(geom, 4326))) AS geometry
          FROM gis_lines
          WHERE project_id = $1
          GROUP BY line_layer_name;
      `;

    const result = await pool.query(query, [projectId]);
    const features = result.rows.map(row => ({
      type: 'Feature',
      properties: { id: row.line_layer_name },
      geometry: JSON.parse(row.geometry)
    }));

    res.json({
      type: 'FeatureCollection',
      features: features
    });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});