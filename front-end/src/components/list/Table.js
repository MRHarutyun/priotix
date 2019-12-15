import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

const Table = (props) => {
  const { days } = props; 
  return(
    <div className="Table-container">
      <table className="Table">
        <thead className="Table-head">
          <tr>
            <th>Day</th>
            <th>Trump</th>
            <th>ISIS</th>
            <th>Esports</th>
            <th>Lady Gaga</th>
          </tr> 
        </thead>
        <tbody className="Table-body">           
          {days.map((d) => (
            <tr key={d.id}>
              <td>
                <span className="Table-element">{d.created_at}</span>
              </td>
              <td>
                <span className="Table-element">{d.trump}</span>
              </td>
              <td>
                <span className="Table-element">{d.isis}</span>
              </td>
              <td>
                <span className="Table-element">{d.esports}</span>
              </td>
              <td>
                <span className="Table-element">{d.ladygaga}</span>
              </td>
            </tr>
          ))}
                    
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
    days: PropTypes.array.isRequired,
};

export default Table;