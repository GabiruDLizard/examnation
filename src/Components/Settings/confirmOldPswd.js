import swal from 'sweetalert2';

export const ConfirmOldPassword = async () => {
    const { value: password } = await swal.fire({
        title: 'Confirm Current Password',
        input: 'password',
        inputLabel: 'Please enter your current password to proceed',
        inputPlaceholder: 'Current Password',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true
    });

    return password || null;
};
