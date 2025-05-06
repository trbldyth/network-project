document.addEventListener('DOMContentLoaded', function() {
    if (isAuthenticated()) {
        const token = localStorage.getItem('token')
        document.querySelectorAll('.authenticated').forEach(async element => {
            element.style.display = 'block';
            await fetch('/api/auth/users/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            }).then(response => response.json())
            .then(async data => {
               document.querySelector('#username').innerHTML = `<strong>${data.username}</strong>`
            })
        })
        document.querySelectorAll('.unauthenticated').forEach(el => {
            el.style.display = 'none';
        })
        document.querySelector('#logout').addEventListener('click', logout);
        document.querySelector('#username').addEventListener('click', () => {
            profile('me')
        });
        document.querySelector('#following').addEventListener('click', following);
    } else {
        document.querySelectorAll('.unauthenticated').forEach(element => {
            element.style.display = 'block';
        })
        document.querySelectorAll('.authenticated').forEach(el => {
            el.style.display = 'none';
        })
        document.querySelector('#register').addEventListener('click', register);
        document.querySelector('#login').addEventListener('click', login);
    }
    posts();

});


function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token
}

function isLiked(id) {
    const liked = localStorage.getItem(`liked_${id}`)
    return !!liked
}

async function register() {
    document.querySelector('#login-view').style.display = 'none';
    document.querySelector('#register-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';
    document.querySelector('#profile').style.display = 'none';
    document.querySelector('#register-form').onsubmit = async (event) => {
        event.preventDefault();
        const email = document.querySelector('#register-email').value;
        const username = document.querySelector('#register-username').value;
        const password = document.querySelector('#register-password').value;
        await fetch('/api/auth/users/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: email,
                username: username,
                password: password,
            })
        }).then(async () => {
            await login(username, password)})
        .then(async () => {
            const token = localStorage.getItem('token')
            window.location.href = '/';
        });
    }
};

async function login(arg1, arg2) {
    if (arg1 && arg2) {
        await fetch('/api/auth/token/login/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                password: arg2,
                username: arg1,
            })
        }).then(response => response.json())
        .then(data => {
            localStorage.setItem('token', data.auth_token)
        }).then(async () => {
            await fetch('api/auth/users/me/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
            }).then(response => response.json()).then(data => {localStorage.setItem('current_user', data.id)})
        })
    } else {
        document.querySelector('#login-view').style.display = 'block';
        document.querySelector('#register-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'none';
        document.querySelector('#profile').style.display = 'none';
        document.querySelector('#login-form').onsubmit = async (event) => {
            event.preventDefault();
            const username = document.querySelector('#login-username').value;
            const password = document.querySelector('#login-password').value;
            await fetch('/api/auth/token/login/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    password: password,
                    username: username,
                })
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`Login failed. Status: ${response.status}`);
                }
                return response.json();
            }).then(data => {
                localStorage.setItem('token', data.auth_token)
            }).catch(error => {
                console.error('Error during login:', error.message);
            }).then(async () => {
                if (isAuthenticated()) {
                    await fetch('api/auth/users/me/', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${localStorage.getItem('token')}`
                        },
                    }).then(response => response.json()).then(data => {localStorage.setItem('current_user', data.id)})
                }
            })
            .then(() => {
                if (isAuthenticated()) {
                    window.location.href = '/'
                } else {
                    alert('Invalid credentials!')
                }
            });
        }
    }
};

function logout() {
    const token = localStorage.getItem('token')
    fetch('/api/auth/token/logout/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
        },
    }).then(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('current_user')
        window.location.href = '/';
    });
};

async function profile(id) {
    const token = localStorage.getItem('token')
    const current_user = localStorage.getItem('current_user')
        document.querySelector('#login-view').style.display = 'none';
        document.querySelector('#register-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        document.querySelector('#posts-compose').style.display = 'none';
        document.querySelector('#profile').style.display = 'block';
        if (isAuthenticated()) {
            request = fetch(`/api/auth/users/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            })
        } else {
            request = fetch(`/api/auth/users/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
        }
        request.then(response => response.json())
        .then(async data => {
            if (id == 'me') {
                id = current_user
            }
                await fetch(`api/users/${id}/follows/`, {
                    headers: {
                        'Content-Type': 'application/json',

                    }
                }).then(response => response.json())
                .then(data => {
                    localStorage.setItem('follows_length', data.count)
                })
                await fetch(`api/users/${id}/followers/`, {
                    headers: {

                    }
                }).then(response => response.json())
                .then(data => {
                    localStorage.setItem('followers_length', data.count)
                })

            document.querySelector('#profile-info').innerHTML = '';
            document.querySelector('#profile-info').innerHTML += `
            <div class="row">
            <div class="col-md-2" style="margin: 50px auto; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); background-color: white;">
            <strong>${data.username}</strong><br>${data.email}<br>
            <span class="follows" id="${id}">Followed to: ${localStorage.getItem('follows_length')}</span> <br> <span class="followers" id=${id}>Followers: ${localStorage.getItem('followers_length')}</span>
            </div>
            <div class="col-md-9" style="margin: 50px auto; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); background-color: white;">
            About:
            </div>
            </div>
            `
            
            if (!(id == 'me' || id == current_user) && isAuthenticated()) {
                document.querySelector('#profile-info').innerHTML += `<div class="col-md-2"> <button style="${data.is_followed ? "background-color: gray" :"background-color: #0056b3"}" id="follow"> ${data.is_followed ? 'Unfollow' : 'Follow'} </button> </div>`
                document.querySelector('#follow').addEventListener('click', async () => {
                    await follow(id, true);
                    setTimeout(() => {
                    profile(id)},200)
                })
            }
            const popup = document.createElement('div');
            popup.className = 'popup';
            popup.style.cssText = `
            position: fixed;
            width: 450px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            font-family: Arial, sans-serif;
            `;
            document.querySelector('.follows').addEventListener('click', async () => {
                await fetch(`api/users/${id}/follows/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    }
                }).then(response => response.json())
                .then(data => {
                    popup.innerHTML = `<span id="close" style="position: absolute; top: 0px; right: 10px">x</span>`;
                    data.result.forEach(item => {
                        popup.innerHTML += `
                        <div style="background-color: gray; margin: 10px" class="container">${item.username}<div>`
                    })
                    document.body.appendChild(popup);
                    document.querySelector('#close').addEventListener('click', () => {
                        document.body.removeChild(popup);
                    });
                })
            })
            document.querySelector('.followers').addEventListener('click', async () => {
                await fetch(`api/users/${id}/followers/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    }
                }).then(response => response.json())
                .then(data => {
                    popup.innerHTML = `<span id="close" style="position: absolute; top: 0px; right: 10px">x</span>`;
                    data.result.forEach(item => {
                        popup.innerHTML += `
                        <div style="background-color: gray; margin: 10px" class="container">${item.username}<div>`
                    })
                    document.body.appendChild(popup);
                    document.querySelector('#close').addEventListener('click', () => {
                        document.body.removeChild(popup);
                    });
                })
            })
        }).then(() => {
            if (id == 'me') {
            id = current_user
            }
            posts(page=1,`/api/posts/?author=${id}&page=${page}`, true, id)
        })
    }


async function follow(id, post=false) {
    const token = localStorage.getItem('token')
    await fetch(`api/auth/users/${id}/`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    }).then(response => response.json())
    .then(data => {
        if (post && !(data.is_followed)) {
            fetch(`api/users/${id}/follow/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
            })
        } else if (post && data.is_followed) {
            fetch(`api/users/${id}/follow/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
            })
        }
    })
}

function clearPostDetail() {
    return new Promise(resolve => {
        document.querySelector('#post-detail').innerHTML = '';
        document.querySelector('#page').innerHTML = '';
        resolve();
    });
}

async function like(id, post=false) {
    const token = localStorage.getItem('token')
    await fetch(`api/posts/${id}/`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        }
    }).then(response => response.json())
    .then(data => {
        if (post && !(data.is_liked)) {
            fetch(`api/posts/${id}/like/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
            })
        } else if (post && data.is_liked) {
            fetch(`api/posts/${id}/like/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
            })
        }
    })
}

async function posts(page=1, url=`/api/posts/?page=${page}`, profileredirect=false, id, followingredirect=false) {
    if (!(profileredirect && !(followingredirect))) {
    document.querySelector('#login-view').style.display = 'none';
    document.querySelector('#register-view').style.display = 'none';
    document.querySelector('#post-detail').style.display = 'block';
    document.querySelector('#posts-compose').style.display = 'none';
    document.querySelector('#profile').style.display = 'none';
    }
    await clearPostDetail();
    const current_user = localStorage.getItem('current_user')
    const token = localStorage.getItem('token')
    if (!(isAuthenticated())) {
        request = fetch(url, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
    } else if (!(followingredirect)) {
        request = fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        })
    } else {
        request = fetch(`api/following/?page=${page}`, { 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        })
    }
    request.then(response => response.json())
        .then(data => {
        data.result.forEach(element => {
            document.querySelector('#post-detail').innerHTML += 
            `<div style="margin: 10px auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); background-color: white;">
            ${element.text}<br>
            <span style="position: absolute; left: 8px;">
            <a class="like" id="${element.id}" href="#"><img src="https://www.freeiconspng.com/uploads/like-heart-icon--16.png" width="25" alt="Like"></a><span class="like_count" id='${element.id}'>${element.likes_count}</span>
            </span>
            <span class="edit_button" id="${element.id}" style="position: absolute; right: 8px;">
            </span><br>
            <span class="username" id="${element.author.id}" style="position: absolute; right: 8px;">
            <strong>${element.author.username}</strong></span><br>
            <span style="position: absolute; right: 8px;">
            ${new Date(element.pub_date).toLocaleString()}</span>
            </div>`;
            if (element.author.id==current_user) {
                document.querySelector(`#post-detail span.edit_button[id="${element.id}"]`).innerHTML +=
                `<button class="edit_button" id="${element.id}" style="background-color: gray; width: 60px; padding: 0px; height: 30px">Edit</button>`
            }
        });
        document.querySelectorAll('#post-detail button.edit_button').forEach(async item =>{
            item.addEventListener('click', async () => {
                post_edit(item.id)
            })
        })
        document.querySelectorAll('#post-detail a.like').forEach(async item => {
            item.addEventListener('click', async () => {
                await like(item.id, true);
                setTimeout(() => {
                    fetch(`api/posts/${item.id}/`, {
                        headers: {'Content-Type': 'application/json'}
                    }).then(response => response.json()).then(data => {
                        document.querySelector(`#post-detail span[id="${data.id}"]`).innerHTML = data.likes_count
                })}, 300);
            });
        });
        document.querySelectorAll('#post-detail span.username').forEach(async user => {
            user.addEventListener('click', async () => {
                profile(user.id)
            })
        })
        if (data.current_page !== 1) {
            const previousPage = document.createElement('button');
            previousPage.setAttribute('style', 'background-color: gray; width: 30px; margin: 5px; font-size: 65%; height: 30px');
            previousPage.classList.add('pageNum');
            previousPage.setAttribute('id', `${data.current_page-1}`);
            previousPage.textContent = '<';
            document.querySelector('#page').appendChild(previousPage);
        }
        for (let q = 1; q<=data.pages_count; q++) {
            const pageElement = document.createElement('button');
            if (q !== data.current_page) {
                pageElement.setAttribute('style', 'background-color: gray; width: 30px; margin: 3px; font-size: 65%; height: 30px');
                pageElement.classList.add('pageNum');
            } else {
                pageElement.setAttribute('style', 'background-color: gray; width: 30px; margin: 3px; opacity: 0.6; cursor: not-allowed; font-size: 65%; height: 30px')
            }
            pageElement.setAttribute('id', `${q}`)
            pageElement.textContent = `${q}`;
            if (data.pages_count>1) {
                document.querySelector('#page').appendChild(pageElement);
            }
        }
        if (data.current_page !== data.pages_count) {
            const nextPage = document.createElement('button');
            nextPage.setAttribute('style', 'background-color: gray; width: 30px; margin: 3px; font-size: 65%; height: 30px');
            nextPage.classList.add('pageNum');
            nextPage.setAttribute('id', `${data.current_page+1}`);
            nextPage.textContent = '>';
            document.querySelector('#page').appendChild(nextPage);
        }
        document.querySelectorAll('.pageNum').forEach(page => {
            page.addEventListener('click', async () => {
                if (!(profileredirect) && !(followingredirect)) {
                    await posts(page.id)
                } else if (!(followingredirect)) {
                    await posts(page.id, `api/posts/?author=${id}&page=${page.id}`, profileredirect, id)
                }
                else {
                    await posts(page.id, undefined, undefined, undefined, true)
                }
            })
        })
    })
    if (!(profileredirect) && !(followingredirect)) {
    if (isAuthenticated()) {
        document.querySelector('#posts-compose').style.display = 'block';
        document.querySelector('#post-text').value = '';
        document.querySelector('#post-button').innerHTML = 'Post'
        document.querySelector('#post-form').onsubmit = async (event) => {
            event.preventDefault();
            const text = document.querySelector('#post-text').value;
            await fetch('/api/posts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    text: text,
                })
            })
            .then(() => {
                window.location.href = '/';
            });
        }
    }
}
};

async function post_edit(id) {
    const token = localStorage.getItem('token')
    document.querySelector('#posts-compose').style.display = 'block';
    document.querySelector('#login-view').style.display = 'none';
    document.querySelector('#register-view').style.display = 'none';
    document.querySelector('#post-detail').style.display = 'none';
    document.querySelector('#profile').style.display = 'none';
    document.querySelector('#page').style.display = 'none';
    document.querySelector('#post-button').innerHTML = 'Save'
    await fetch(`/api/posts/${id}/`, {
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        document.querySelector('#post-text').value = `${data.text}`;
    })
    document.querySelector('#post-form').onsubmit = async (event) => {
        event.preventDefault();
        const text = document.querySelector('#post-text').value;
        await fetch(`/api/posts/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                text: text
            })
        }).then(() => {
            posts()
        });
    }
}


async function following() {
    document.querySelector('#login-view').style.display = 'none';
    document.querySelector('#register-view').style.display = 'none';
    document.querySelector('#post-detail').style.display = 'block';
    document.querySelector('#posts-compose').style.display = 'none';
    document.querySelector('#profile').style.display = 'none';
    await clearPostDetail();
    posts(undefined, undefined, undefined, undefined, true)
}