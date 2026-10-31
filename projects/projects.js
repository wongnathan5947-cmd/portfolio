import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Project${projects.length === 1 ? '' : 's'}`;

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let query = '';
let selectedIndex = -1;
let currentData = [];

function getSearchFiltered() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(projectsGiven, (v) => v.length, (d) => d.year);
  currentData = rolledData.map(([year, count]) => ({ value: count, label: year }));

  let arcData = d3.pie().value((d) => d.value)(currentData);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : null)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        applyFilters();
      });
  });

  currentData.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', 'legend-item' + (i === selectedIndex ? ' selected' : ''))
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        applyFilters();
      });
  });
}

function applyFilters() {
  let searchFiltered = getSearchFiltered();

  let selectedYear = selectedIndex === -1 ? null : currentData[selectedIndex]?.label;
  renderPieChart(searchFiltered);

  if (selectedYear !== null) {
    selectedIndex = currentData.findIndex((d) => d.label === selectedYear);
    if (selectedIndex === -1) {
      renderProjects(searchFiltered, projectsContainer, 'h2');
      return;
    }
    renderPieChart(searchFiltered);
    renderProjects(
      searchFiltered.filter((p) => p.year === selectedYear),
      projectsContainer,
      'h2',
    );
  } else {
    renderProjects(searchFiltered, projectsContainer, 'h2');
  }
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  applyFilters();
});

applyFilters();