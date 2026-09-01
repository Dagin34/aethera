/** What the contact form's action hands back to the page.
 *
 *  Shared so the form component and the action can't drift: a rejected letter
 *  returns what was written along with what was wrong with it, and an accepted
 *  one returns the desk it went to so the confirmation can name it. */
export type ContactValues = {
	enquiry: string;
	name: string;
	email: string;
	message: string;
};

export type ContactErrors = Partial<Record<keyof ContactValues | 'form', string>>;

export type ContactResult = {
	success?: boolean;
	/** Named on success, so the confirmation says where the letter actually went. */
	desk?: string;
	values?: ContactValues;
	errors?: ContactErrors;
};
