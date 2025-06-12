// @project
import other from './other';
import pages from './pages';
import prototype from './prototype';
import uiElements from './ui-elements';
import manage from './manage';
import supervisor from './supervisor';

/***************************  MENU ITEMS  ***************************/

const menuItems = {
  items: [manage, uiElements, pages, other],
  prototype: [prototype],
  supervisor: [supervisor]
};

export default menuItems;
