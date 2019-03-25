import { Navigator } from '../_pageloader';

class NavAjaxPageLoad extends HTMLElement {
  constructor() {
    super();

    this.nav = new Navigator((loader, event) => {
      event.target.classList.add('disabled');
      loader
        .load()
        .then(page => page.addNewStyles('body'))
        .then(page =>
          page.replaceContent('main', {
            animationClass: 'bouncyFadeOut',
            duration: 0.7
          })
        )
        .then(page => page.removeOldStyles('body'))
        .then(() => this.prepareLoadedContent(event))
        .catch(e => {
          // Connection lost? Check login
          console.error('Failed to load page:', e.message);
          document.querySelector('main').innerHTML = `
  <main class='centered m-4'>
    <section class='card p-4'>
      <h4>Error loading the page ☹</h4>
      ${e.message ? e.message : e}
    </section>
  </main>
  `;
          document.dispatchEvent(new Event('FailedLoading'));
        });
    });

    this.nav.init();
  }

  prepareLoadedContent(event) {
    if (event.target) event.target.classList.remove('disabled');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 50);
  }
}

customElements.define('nav-ajax-page-load', NavAjaxPageLoad);
