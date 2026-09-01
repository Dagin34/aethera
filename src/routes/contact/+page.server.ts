import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { findEnquiry } from '$lib/enquiries';
import type { ContactErrors, ContactValues } from '$lib/contact-types';

/** Deliberately loose: the only claim worth making here is that the address has
 *  the shape of one. Anything stricter rejects real addresses, and the real test
 *  is whether the reply arrives. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = { name: 120, email: 200, message: 4000 };

const read = (data: FormData, key: string) => String(data.get(key) ?? '').trim();

function validate(values: ContactValues): ContactErrors {
	const errors: ContactErrors = {};

	if (!findEnquiry(values.enquiry)) {
		errors.enquiry = 'Choose a reason for writing.';
	}

	if (!values.name) {
		errors.name = 'Tell us who you are.';
	} else if (values.name.length > LIMITS.name) {
		errors.name = `Keep this under ${LIMITS.name} characters.`;
	}

	if (!values.email) {
		errors.email = 'We need an address to reply to.';
	} else if (values.email.length > LIMITS.email || !EMAIL.test(values.email)) {
		errors.email = 'This address is missing something — check it and try again.';
	}

	if (!values.message) {
		errors.message = 'Write a line or two about what you need.';
	} else if (values.message.length < 10) {
		errors.message = 'A little more, so we can answer properly.';
	} else if (values.message.length > LIMITS.message) {
		errors.message = `Keep this under ${LIMITS.message} characters.`;
	}

	return errors;
}

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const values: ContactValues = {
			enquiry: read(data, 'enquiry'),
			name: read(data, 'name'),
			email: read(data, 'email'),
			message: read(data, 'message')
		};

		// The honeypot is hidden from people, so anything in it came from something
		// filling every field it found. Accept it silently rather than teach it.
		if (read(data, 'company')) {
			return { success: true, desk: 'The house' };
		}

		const errors = validate(values);
		if (Object.keys(errors).length > 0) {
			return fail(400, { values, errors });
		}

		const desk = findEnquiry(values.enquiry)!;

		// TODO: nothing is delivered yet — wire this to the mail provider once the
		// host is chosen. Everything the send needs is already here: `desk.to` is
		// the recipient, `values` is the letter. Replace this block with the send,
		// and return fail(500, { values, errors: { form: … } }) if it rejects, so
		// the writer keeps what they typed.
		console.log('[contact] letter received (not yet delivered)', {
			to: desk.to,
			desk: desk.desk,
			from: `${values.name} <${values.email}>`,
			message: values.message
		});

		return { success: true, desk: desk.desk };
	}
};
