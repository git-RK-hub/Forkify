// Global app controller 
import Search from './models/Search' ;
import Recipe from './models/Recipe' ;
import List from './models/List' ;
import Like from './models/Like' ;
import * as searchView from './views/searchView' ;
import * as recipeView from './views/recipeView' ;
import * as listView from './views/listView' ;
import * as likeView from './views/likeView' ;
import { elements, renderLoader, clearLoader} from './views/base' ;
const state = {} ;

/**********SEARCH CONTROLLER*******
*/
const controlSearch = async () => {
    // 1. Get query from view
   
    const query  = searchView.getInput() ;
    if(query){
        // 2. New Search object and add to state
        state.search = new Search(query);
        
        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try{
        // 4. Search for recipes
        await state.search.getResults();
        // 5. Render results on UI
        clearLoader() ;
        searchView.renderResults(state.search.recipes);
        }catch(err){
            alert(`Error in getting Results`)
            clearLoader(); 
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
   e.preventDefault();
   controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.recipes, goToPage);
    }
});

//*********************************************************************

//********** RECIPE CONTROLLER **********
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );

        } catch (err) {
            alert('Error processing recipe!');
        }
    }
};
//*******************************************************************


//********************** LIST CONTROLLER ********************

const controlList = () => {
    
    if(!state.list) state.list = new List();
    state.recipe.ingredients.forEach(el =>{
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderList(item);
    });
    
}
// Handling update serving button clicks
elements.shopping.addEventListener('click', el => {
   const id = el.target.closest('.shopping__item').dataset.itemid ;
    
    if(el.target.matches('.shopping__delete, .shopping__delete *')){
        
        state.list.deleteItem(id);
        listView.deleteItem(id);
    }else if(el.target.matches('.shopping__item-value')){
        const val = parseFloat(el.target.value,10);
        state.list.updateCount(id ,val);
    }
});
//***********************************************************************


//*******************LIKE CONTROLLER *************************


const controlLike = () => {
    if(!state.likes) state.likes = new Like();
    const currentId = state.recipe.id ;
    
    if(!state.likes.isLiked(currentId)){
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        likeView.toggleLikeBtn(true);
        likeView.renderLike(newLike);
    }
    else {
        state.likes.deleteLike(currentId);
        likeView.toggleLikeBtn(false);
        likeView.deleteLike(currentId);
    }
}

//restore liked recipes on page load
window.addEventListener('load',() => {
    state.likes = new Like();
    state.likes.readStorage();
    likeView.toggleLikeMenu(state.likes.getNumLikes()); 
    state.likes.likes.forEach(el => likeView.renderLike(el));
});

//*************************************************************
elements.recipe.addEventListener('click' , e=> {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //decrease btn is clicked
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        
    }else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase btn is clicked
        if(state.recipe.servings >1){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
        }
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add * ')){
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        controlLike();
    }
    
});

['hashchange', 'load'].forEach(event => window.addEventListener(event,controlRecipe));


