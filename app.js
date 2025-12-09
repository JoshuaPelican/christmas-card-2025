class App{
    constructor(){
        this.history = new HistoryManager();
        this.init();
    }

    init(){
        this.history
            .register('/', () => this.displayHome())
            .register('/recipe', (data) => this.displayRecipe(data.params.id));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.history.back();
            }
        });
    }

    displayHome(){
        if(this.activeCookie)
            this.closeRecipe();
    }

    displayRecipe(recipeID) {
        if(!this.activeCookie){
            document.querySelector(`[data-cookie-i-d="${recipeID}"]`).dispatchEvent(new Event('click'));
        }
        this.recipeDisplay.scrollTop = 0;
        this.recipeDisplay.innerHTML = this.recipeBuilder.buildRecipe(recipeID);
        document.getElementById('closeBtn').addEventListener('click', () => this.history.back());
    }
}

const app = new App();