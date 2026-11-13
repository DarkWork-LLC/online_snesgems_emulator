/* WYSIWYG rich-text editor frontend. Vanilla JS, no dependencies. */

(function () {
    const editor = document.getElementById('editor');
    const toolbar = document.getElementById('toolbar');
    const titleInput = document.getElementById('title');
    const slugInput = document.getElementById('slug');
    const pageIdInput = document.getElementById('page-id');
    const saveBtn = document.getElementById('btn-save');
    const previewBtn = document.getElementById('btn-preview');
    const deleteBtn = document.getElementById('btn-delete');
    const backBtn = document.getElementById('btn-back');
    const saveStatus = document.getElementById('save-status');
    const wordCount = document.getElementById('word-count');

    if (!editor) return;

    editor.dataset.placeholder = 'Start writing…';

    // ------------------------------------------------------------------ #
    // Helpers
    // ------------------------------------------------------------------ #

    function setStatus(msg, kind = 'ok') {
        saveStatus.textContent = msg;
        saveStatus.style.color = kind === 'ok' ? '#4ade80' : '#f87171';
        saveStatus.style.opacity = '1';
        setTimeout(() => { saveStatus.style.opacity = '0'; }, 1500);
    }

    function updateWordCount() {
        const text = editor.textContent.trim();
        const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
        wordCount.textContent = count + ' word' + (count === 1 ? '' : 's');
    }

    function focusEditor() {
        editor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // ------------------------------------------------------------------ #
    // Toolbar commands
    // ------------------------------------------------------------------ #

    toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.tbtn');
        if (!btn) return;
        e.preventDefault();

        const action = btn.dataset.action;
        const value = btn.dataset.value || null;

        if (document.activeElement !== editor) focusEditor();

        switch (action) {
            case 'undo':
                document.execCommand('undo', false, null);
                break;
            case 'redo':
                document.execCommand('redo', false, null);
                break;
            case 'bold':
                document.execCommand('bold', false, null);
                break;
            case 'italic':
                document.execCommand('italic', false, null);
                break;
            case 'underline':
                document.execCommand('underline', false, null);
                break;
            case 'strike':
                document.execCommand('strikeThrough', false, null);
                break;
            case 'formatBlock':
                document.execCommand('formatBlock', false, value);
                break;
            case 'insertUnorderedList':
                document.execCommand('insertUnorderedList', false, null);
                break;
            case 'insertOrderedList':
                document.execCommand('insertOrderedList', false, null);
                break;
            case 'justifyLeft':
                document.execCommand('justifyLeft', false, null);
                break;
            case 'justifyCenter':
                document.execCommand('justifyCenter', false, null);
                break;
            case 'justifyRight':
                document.execCommand('justifyRight', false, null);
                break;
            case 'link': {
                const url = prompt('Enter URL:', 'https://');
                if (url) document.execCommand('createLink', false, url);
                break;
            }
            case 'unlink':
                document.execCommand('unlink', false, null);
                break;
            case 'code': {
                const sel = window.getSelection();
                let text = sel.toString().trim();
                if (!text) text = 'code';
                document.execCommand('insertHTML', false, '<code>' + escapeHtml(text) + '</code>');
                break;
            }
            case 'removeFormat':
                document.execCommand('removeFormat', false, null);
                break;
            case 'insertHTML':
                document.execCommand('insertHTML', false, value);
                break;
        }

        updateWordCount();
    });

    editor.addEventListener('input', updateWordCount);
    editor.addEventListener('keyup', updateWordCount);
    editor.addEventListener('mouseup', updateWordCount);
    // ------------------------------------------------------------------ #
    // Save / delete / preview
    // ------------------------------------------------------------------ #

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function deriveSlug(title) {
        return String(title)
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    titleInput.addEventListener('input', () => {
        if (!slugInput.value) {
            slugInput.value = deriveSlug(titleInput.value);
        }
    });

    async function savePage() {
        const title = titleInput.value.trim();
        if (!title) {
            setStatus('Title is required.', 'err');
            titleInput.focus();
            return;
        }

        const payload = {
            id: pageIdInput.value || null,
            title,
            slug: slugInput.value.trim() || deriveSlug(title),
            content: editor.innerHTML,
        };

        try {
            const res = await fetch('/wysiwyg/api/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setStatus(data.error || 'Save failed.', 'err');
                return;
            }
            if (!pageIdInput.value) {
                pageIdInput.value = data.id;
                history.replaceState(null, '', '/wysiwyg/' + data.slug + '/edit/');
            }
            setStatus('Saved.');
        } catch (e) {
            setStatus('Save error: ' + e.message, 'err');
        }
    }

    async function deletePage() {
        const id = pageIdInput.value;
        if (!id) return;
        if (!confirm('Delete this page?')) return;
        try {
            const res = await fetch('/wysiwyg/api/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setStatus('Deleted.');
                setTimeout(() => { location.href = '/wysiwyg/'; }, 600);
            } else {
                setStatus('Delete failed.', 'err');
            }
        } catch (e) {
            setStatus('Delete error: ' + e.message, 'err');
        }
    }

    saveBtn.addEventListener('click', savePage);
    deleteBtn && deleteBtn.addEventListener('click', deletePage);
    previewBtn.addEventListener('click', () => {
        const slug = slugInput.value.trim() || deriveSlug(titleInput.value);
        location.href = '/wysiwyg/' + slug + '/';
    });
    backBtn.addEventListener('click', () => { location.href = '/wysiwyg/'; });

    // ------------------------------------------------------------------ #
    // CSRF cookie helper (Django)
    // ------------------------------------------------------------------ #

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Initialise
    updateWordCount();

})();

