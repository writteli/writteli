(() => {
  console.log('!HELLO WRITTELI!')
  // simple example of blog post flist iltering
  const filterNotesByCategory = (category, list, dom) => {
    dom.innerHTML = `${list.filter(entry => entry.category.includes(category)).map(entry => `
      <li><a href='${entry.url}'><span>${entry.date}</span> - ${entry.title}</a></li>
    `).join('')}`
  }

  const filterNotesByTag = (tag, list, dom) => {
    dom.innerHTML = `${list.filter(entry => entry.tags.includes(tag)).map(entry => `
      <li><a href='${entry.url}'><span>${entry.date}</span> - ${entry.title}</a></li>
    `).join('')}`
  }

  if (location.pathname === '/blog/') {
    const params = new URLSearchParams(location.search)
    const category = params.get('category')
    const tag = params.get('tag')
    // get full entry list if needed
    if ((category !== null && category.length) || (tag !== null && tag.length)) {
      fetch('/blog/list.json').then(resp => resp.json()).then(data => {
        const entryList = data && data.list && data.list.length ? data.list : []
        // remove current notes entry, calendars and hide pagination
        const notesWrapper = document.querySelector('ul.blog-list')
        if (notesWrapper) {
          notesWrapper.innerHTML = ''
        }
        // hide pagination (if turned on)
        const pagination = document.getElementById('pagination')
        if (pagination) {
          pagination.style.display = 'none'
        }
        // handle filtering
        if (category !== null && category.length) {
          filterNotesByCategory(category.toLowerCase(), entryList, notesWrapper)
        } else if (tag !== null && tag.length) {
          filterNotesByTag(tag.toLowerCase(), entryList, notesWrapper)
        }
      }).catch(err => {
        throw new Error(err)
      })
    }
  }
})();
