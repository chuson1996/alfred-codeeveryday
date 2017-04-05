'use strict';
const alfy = require('alfy');
const _ = require('lodash');
const API_URL = 'codeeveryday.life/api';
const compareDesc = require('date-fns/compare_desc');

const sify = JSON.stringify;
const inputTags = alfy.input.split(',').map((tag) => tag.trim());

function getResourcesByTag(tag) {
	return alfy.fetch(`${API_URL}/?query={
		tags(tagName: ${sify(tag)}) {
			resources {
				_id
				url
				title
				description
				createdAt
				tags {
					name
				}
			}
		}
	}`)
	.then(({data, errors}) => {
		if ((errors && errors.length) || (!data.tags.length)) {
			return Promise.reject(`${tag} not found`)
		}

		return Promise.resolve(data.tags[0].resources);
	})
}

Promise.all(inputTags.map(getResourcesByTag))
	.then((resourcesSets) => {
		const outputItems = _.intersectionBy.apply(
			null,
			resourcesSets.concat([(r) => r._id])
		)
		.sort((r1, r2) => {
			const date1 = r1.createdAt;
			const date2 = r2.createdAt;
			return compareDesc(date1, date2);
		})
		.map((resource) => ({
			title: resource.title,
			subtitle: `(${resource.tags.map((tag) => tag.name).join(', ')}) ${resource.description}`,
			arg: resource.url
		}));

		alfy.output(outputItems);
	});


