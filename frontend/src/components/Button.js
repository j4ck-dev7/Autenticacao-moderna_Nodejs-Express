import React from 'react';

export default function Button({ children, ...props }) {
  return (  
    <button className="button" {...props}>
      {children}
    </button>
  );
}

// Os ocomponentes feitos por desenvolvedores tem que começar com letra maiúscula, as letras minusculas ficam
// para o react entender que são componentes nativos do html.