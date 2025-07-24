interface MainHeaderProps {
  title: string;
  description: string;
}
function MainHeader({ title, description }: MainHeaderProps) {
  return (
    <header>
      <h2 className="font-bold text-xl mb-6">{title}</h2>
      <h2 className="font-bold text-xl mb-4">{description}</h2>
    </header>
  );
}

export default MainHeader;
