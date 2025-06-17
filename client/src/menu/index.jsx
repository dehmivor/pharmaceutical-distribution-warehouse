// @project
import other from './other';
import pages from './pages';
import prototype from './prototype';
import uiElements from './ui-elements';
import manage from './manage';
import supervisor from './supervisor';
import warehouse from './warehouse';
import representative from './representative';

/***************************  MENU ITEMS  ***************************/

const menuItems = {
  items: [manage, uiElements, pages, other],
  prototype: [prototype],
  supervisor: [supervisor, pages, other],
  warehouse: [warehouse, pages, other],
  representative: [representative, pages, other]
};

export default menuItems;
